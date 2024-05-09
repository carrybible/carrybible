import { RuntimeOptions, runWith, config } from 'firebase-functions'
import { Service, } from '../shared'
import Stripe from 'stripe';

import { Mailchimp } from '../video/'
import { Donation } from './func_carry_donate_setup';


const db = Service.Firebase.firestore()

const stripe = new Stripe(config().stripe.secret_key, {
  apiVersion: '2022-11-15',
});

const STRIPE_WEBHOOK_SIGNING_SECRET: string = config().stripe.carry_donate_webhook_secret;
const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] '

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

/**
 * Called by Stripe to record success of Carry donation
 * Sends receipt to donor
 */
export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  let success = false;

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    try {
      const sig = req.headers['stripe-signature']

      let event: Stripe.Event | undefined

      if (sig === undefined) throw new Error("Stripe signature not received")
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SIGNING_SECRET);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack)
          res.status(400).send(`Webhook Error: ${e.message}`);
        }
      }
      console.log(`Validated stripe webhook with event id ${event?.id}`)
      const isDuplicate = await isDuplicateEvent(event?.id)
      if (!isDuplicate) {
        console.log(`Event ${event?.id} is not duplicate`)
        if (event?.type === "payment_intent.succeeded") {
          const stripeObject = event.data.object as Stripe.PaymentIntent;

          if (stripeObject.metadata.type === 'carry-donation' && stripeObject.metadata.carry_id) {
            await handleDonation(stripeObject)
          } else {
            console.log(`Ignoring ${event?.id} as not carry donation`)
          }



          success = true;
        } else {
          console.log(`Ignoring ${event?.id} as no handler`)
          success = true;
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

async function isDuplicateEvent(eventId: string | undefined) {

  if (!eventId) return false
  const eventRef = db.collection("stripe").doc("events").collection("paymentIntents").doc(eventId)
  return (await eventRef.get()).exists
}

async function logEvent(eventId: string | undefined) {
  if (eventId) {
    const eventRef = db.collection("stripe").doc("events").collection("paymentIntents").doc(eventId)
    await eventRef.set({})
  }
}

async function handleDonation(paymentIntent: Stripe.PaymentIntent) {

  const donationId = paymentIntent.metadata.carry_id;

  const donationRef = db.collection('donations').doc(donationId);
  const donationSnap = await donationRef.get();

  if (donationSnap.exists) {

    const donation = donationSnap.data() as Donation;

    donationRef.update({
      paid: true,
    })

    const amountString = donation.amount.toString();

    const amountFormat = `$${amountString.slice(0, amountString.length - 2)}.${amountString.slice(-2)}`;

    if (donation.email) {
      const mergeVars = [
        {
          name: 'DATE',
          content: new Date().toDateString(),
        },
        {
          name: 'AMOUNT',
          content: amountFormat
        },
        {
          name: 'RECURRING',
          content: donation.frequency === 'one-time' ? 'No' : 'Yes'
        },
      ]

      await Mailchimp.sendEmailTemplate(
        "Carry",
        "hello@carrybible.com",
        "thank-you-email",
        devPrefix + "Thank you! 🙏",
        donation.email,
        `${donation.firstName} ${donation.lastName}`,
        mergeVars
      )
    }


  }

}
