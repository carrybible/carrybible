import { config, logger, RuntimeOptions, runWith } from 'firebase-functions'
import Stripe from 'stripe'
import { makeDonate } from '../admin/https/func_make_donate'
import { Service } from '../shared'
import collections from '../types/collections'
import { StripCheckout } from './func_create_checkout'

const db = Service.Firebase.firestore()

const stripe = new Stripe(config().stripe.secret_key, {
  apiVersion: '2022-11-15',
})

const STRIPE_WEBHOOK_SIGNING_SECRET: string = config().stripe.donate_webhook_secret

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
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
          return
        }
      }
      logger.log(`Validated stripe webhook with event id ${event?.id}`)
      // Handle the event
      switch (event?.type) {
        case 'checkout.session.completed':
          const stripeObject: Stripe.Checkout.Session = event.data.object as Stripe.Checkout.Session
          stripeObject.id
          logger.info('WEBHOOK', stripeObject)

          const checkoutRef = db.collection(collections.CHECKOUTS).doc(stripeObject.id)
          const checkoutDoc = await checkoutRef.get()

          if (!checkoutDoc.exists) {
            logger.error('Not found checkout')
            res.status(400).send('Event not found')
            return
          }

          await checkoutDoc.ref.update({ ...stripeObject })

          const checkoutData = checkoutDoc.data() as StripCheckout
          const info = checkoutData.requestOptions.info
          const result = await makeDonate(checkoutData.requestOptions.uid, {
            amount: (checkoutData.amount_total || 0) / 100,
            currency: checkoutData.requestOptions.currency,
            ...info,
            ...(info.type === 'campaign' ? { campaignId: info.eventId } : { fundId: info.eventId }),
            transactionDetails: stripeObject,
          })

          if (result.success) {
            res.status(200).json({ success: true })
            return
          }
          break
        default:
          console.log(`Unhandled event type ${event?.type}`)
      }
    } catch (e) {
      if (e instanceof Error) logger.error('Error on WEBHOOK', e)
    } finally {
      res.status(400).json({ success: false })
    }
  } else {
    res.status(405).send()
  }
})
