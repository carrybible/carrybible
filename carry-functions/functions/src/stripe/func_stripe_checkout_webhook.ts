import { RuntimeOptions, runWith, config } from 'firebase-functions'
import { Service } from '../shared'
import Stripe from 'stripe'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'
import { randomUUID } from 'crypto'
import { CarryUtils, Slack, Mailchimp, MailchimpMarketing } from '../video/'

const db = Service.Firebase.firestore()
const auth = Service.Firebase.auth()

const stripe = new Stripe(config().stripe.secret_key, {
  apiVersion: '2022-11-15',
})

const STRIPE_WEBHOOK_SIGNING_SECRET: string = config().stripe.checkout_webhook_secret
const MAILCHIMP_AUDIENCE_ID: string = 'b52e3226c0'
const DASHBOARD_URL: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : ''

const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : '[Dev] '
const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'

const devProducts = {
  '': {
    groupCap: 0,
    id: '',
    memberCap: 70,
    name: 'Church',
    videoCap: 10,
  },
  '': {
    groupCap: 3,
    id: '',
    memberCap: 35,
    name: 'Grow',
    videoCap: 4,
  },
}

const liveProducts = {
  prod_MncF3ANIUTq3C2: {
    groupCap: 0,
    id: '',
    memberCap: 70,
    name: 'Church',
    videoCap: 10,
  },
  prod_MncFk9I9XmrdwY: {
    groupCap: 3,
    id: '',
    memberCap: 35,
    name: 'Grow',
    videoCap: 4,
  },
}

const products = isDev ? devProducts : liveProducts

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  let success = false

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    try {
      const sig = req.headers['stripe-signature']

      let event: Stripe.Event | undefined

      if (sig === undefined) throw new Error('Stripe signature not received')
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SIGNING_SECRET)
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack)
          res.status(400).send(`Webhook Error: ${e.message}`)
        }
      }
      console.log(`Validated stripe webhook with event id ${event?.id}`)
      const isDuplicate = await isDuplicateEvent(event?.id)
      if (!isDuplicate) {
        console.log(`Event ${event?.id} is not duplicate`)
        if (event?.type === 'checkout.session.completed') {
          const stripeObject: Stripe.Checkout.Session = event.data.object as Stripe.Checkout.Session
          await handleCheckOutSessionCompletion(stripeObject)
          success = true
        } else {
          console.log(`Ignoring ${event?.id} as no handler`)
        }
        await logEvent(event?.id)
      } else {
        console.log(`Duplicate event ${event?.id}`)
      }
    } catch (e) {
      if (e instanceof Error) console.error(e.stack || e.message)
    } finally {
      console.log(`Sending 200 response`)
      res.status(200).json({ success: success })
    }
  } else {
    res.status(405).send()
  }
})

async function handleCheckOutSessionCompletion(checkoutSession: Stripe.Checkout.Session) {
  // carry subscription purchase on website
  if (checkoutSession.payment_link && checkoutSession.subscription) await handleNewSubscription(checkoutSession)
}

async function isDuplicateEvent(eventId: string | undefined) {
  if (!eventId) return false
  const eventRef = db.collection('stripe').doc('events').collection('entries').doc(eventId)
  return (await eventRef.get()).exists
}

async function logEvent(eventId: string | undefined) {
  if (eventId) {
    const eventRef = db.collection('stripe').doc('events').collection('entries').doc(eventId)
    await eventRef.set({})
  }
}

async function handleNewSubscription(checkoutSession: Stripe.Checkout.Session) {
  let userUpdateSuccess = false

  let orgId = checkoutSession.client_reference_id
  let email = checkoutSession.customer_email || checkoutSession.customer_details?.email
  let campusId
  let planName

  try {
    const subscriptionId: string = checkoutSession.subscription?.toString() || ''

    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (subscription.items.object !== 'list' && subscription.items.data.length === 0)
      throw new Error(`Cannot find subscription ${subscriptionId}`)

    const item = subscription.items.data[0]

    const productId = item.price.product
    let productData: any = {}

    if (typeof productId === 'string') {
      const tier = (
        await db
          .collection('stripe')
          .doc('products')
          .collection('tiers')
          .where('active', '==', true)
          .where('stripeProductId', '==', productId)
          .limit(1)
          .get()
      ).docs[0].data()

      if (!tier) {
        console.log('cannot find tier, using backup')
        productData = products[productId as keyof typeof products]
      } else {
        productData = tier
        planName = tier.name
        console.log(`Found product tier ${tier.tierId} from stripe product ${productId}`)
      }
    } else {
      throw new Error(`Can't get product id from ${subscriptionId}`)
    }

    const subscriptionRecord: any = {
      stripeSessionId: checkoutSession.id,
      stripeCustomerId: checkoutSession.customer,
      customerAddress: checkoutSession.customer_details?.address,
      customerEmail: checkoutSession.customer_email,
      customerProvidedEmail: checkoutSession.customer_details?.email,
      customerName: checkoutSession.customer_details?.name,
      amount: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      created: checkoutSession.created,
      mode: checkoutSession.mode,
      paymentLinkId: checkoutSession.payment_link,
      paymentStatus: checkoutSession.payment_status,
      sessionStatus: checkoutSession.status,
      subscriptionId: subscriptionId,
      stripePriceId: item.price.id,
      stripeProductId: item.price.product,
      orgId: checkoutSession.client_reference_id,
      ...productData,
    }

    await db.collection('stripe').doc('subscriptions').collection('entries').doc(subscriptionId).set(subscriptionRecord)

    if (!orgId && !email) {
      throw new Error(`💲someone has paid without an org or an email address, can't upgrade`)
    }

    // orgId not provided but tied to email
    if (!orgId && email) {
      const orgs = (await db.collection('organisations').where('mainEmail', '==', email).get()).docs

      if (orgs.length > 0) {
        if (orgs.length > 1) console.log(`multiple orgs with the same email ${email}`)
        orgId = orgs[0].id
      }

      if (!orgId) {
        const videos = (await db.collection('videos').where('email', '==', email).get()).docs

        if (videos.length > 0) {
          orgId = videos[0].data().orgId
        }
      }

      if (!orgId) {
        console.info(`Cannot find org for email ${email}, creating a new org and campus`)

        orgId = await CarryUtils.createOrg(email, '', email, 'pricing-page')
        campusId = await CarryUtils.createCampus(orgId, email, '')
      }
    }

    if (!orgId) throw new Error(`No org Id to upgrade from ${email}`)

    const orgRef = db.collection('organisations').doc(orgId)
    const orgData = (await orgRef.get()).data()

    if (!orgData) throw new Error(`${orgId} does not have any org data`)

    if (!email) {
      if (orgData.mainEmail) {
        email = orgData.mainEmail
      }
    }

    if (orgData?.mainCampus) campusId = orgData.mainCampus

    if (!campusId) {
      const campuses = (await db.collection('organisations').doc(orgId).collection('campuses').limit(1).get()).docs

      if (campuses.length > 0) {
        campusId = campuses[0].id
      } else {
        console.log(`Created campus ${campusId} `)
      }
    }

    const orgUpdate: any = {
      mainEmail: orgData.mainEmail || email,
      stripeCustomerId: checkoutSession.customer,
      subscription: {
        active: true,
        ...productData,
      },
      billing: {
        enabled: true,
        url: '',
      },
    }

    console.info(`Upgrading org ${orgId} with ${email} to plan ${productData.name}`)

    await orgRef.update(orgUpdate)

    if (!email) throw new Error(`No user email for ${orgId}`)

    try {
      console.info(`Updating mailchimp marketing with subscribed tag`)
      await MailchimpMarketing.addMemberTags(MAILCHIMP_AUDIENCE_ID, email, ['Subscribed'])
    } catch (e) {
      console.warn(`Can't update MailChimp to add Subscribed tag for ${email}`)
      try {
        await Slack.sendGrowthAlertMessage(`Can't update MailChimp to add Subscribed tag for ${email}`)
      } catch (e) {
        console.warn(`Can't send slack message`)
      }
    }

    let userRecord: UserRecord

    console.info(`Getting firebase auth`)
    try {
      userRecord = await auth.getUserByEmail(email)
    } catch (e) {
      console.info(`Creating new firebase auth`)
      userRecord = await auth.createUser({
        email: email,
        password: randomUUID(),
      })
    }

    const userRef = db.collection('users').doc(userRecord.uid)
    let userExists = (await userRef.get()).exists

    let counter = 0

    while (!userExists && counter <= 5) {
      console.log('User not found, waiting for auth hook to complete ' + counter)
      await new Promise((resolve) => setTimeout(resolve, 5000))
      userExists = (await userRef.get()).exists
      counter++
    }

    const userUpdate: any = {
      organisation: {
        id: orgId,
        campusId: campusId,
        role: productData.role,
      },
    }

    try {
      console.info(`Updating user data`)
      await userRef.update(userUpdate)
      userUpdateSuccess = true
    } catch (e) {
      console.warn("Can't update user record")
      console.log(e)
    }

    //console.log(userUpdateresponse);
  } catch (e) {
    if (e instanceof Error) {
      console.log(`Error processing stripe upgrade`)
      console.log(e.stack || e.name)
      userUpdateSuccess = false
    }
  }

  if (userUpdateSuccess && email) {
    console.info(`Sending email to ${email}`)

    const mergeVars = [
      {
        name: 'LOGINLINK',
        content: DASHBOARD_URL,
      },
    ]

    const userEmailResponse = await Mailchimp.sendEmailTemplate(
      'Carry',
      'hello@carrybible.com',
      'growth-experiment-premium-unlocked',
      devPrefix + 'Your full Carry dashboard access 🔓',
      email,
      'Carry Customer',
      mergeVars,
    )

    try {
      await Slack.sendGrowthAlertMessage(`💲${email} signed up to ${planName} plan`)
    } catch (e) {
      console.warn(`Can't send slack message`)
    }

    if (!userEmailResponse.success) {
      console.warn('Could not send user dashboard welcome email ' + userEmailResponse.error)
      try {
        await Slack.sendGrowthAlertMessage(`Can't send dashboard welcome email for ${email}`)
      } catch (e) {
        console.warn(`Can't send slack message`)
      }
    }
  } else if (!userUpdateSuccess && email) {
    console.log(`Sending error email to user`)
    await Mailchimp.sendEmailTemplate(
      'Carry',
      'hello@carrybible.com',
      'growth-experiment-error-upgrading',
      devPrefix + '⚠️ Problem upgrading your Carry account',
      email,
      'Carry Customer',
    )

    try {
      await Slack.sendGrowthAlertMessage(`⚠️💲${email} could not sign up to plan - error occured`)
    } catch (e) {
      console.warn(`Can't send slack message`)
    }
  }
}
