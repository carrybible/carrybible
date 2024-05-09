import { RuntimeOptions, runWith, config } from 'firebase-functions'
import Stripe from 'stripe';
import { Service } from '../shared'


const db = Service.Firebase.firestore();
const stripe = new Stripe(config().stripe.secret, { apiVersion: '2022-11-15' })

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
}

/**
 * Called on second step for Carry donations
 * Updates payment intent with queried or created stripe customer
 */
export default runWith(runtimeOpts).https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else if (req.method === "POST") {

    const id = req.body.id as string;
    const paymentIntentId = req.body.payment_intent_id as string;
    const firstName = req.body.first_name as string;
    const lastName = req.body.last_name as string;
    const emailAddress = req.body.email_address as string;

    const response: { success: boolean, error?: string } = {
      success: false
    }
    let status = 400;

    if (id && paymentIntentId && firstName && lastName && emailAddress) {
      try {

        let customerId;

        // find existing customer with matching email
        const customerQuery = await stripe.customers.search({
          query: `email:\'${emailAddress}\'`,
        });

        if (customerQuery.data.length > 0) {
          customerId = customerQuery.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            name: `${firstName} ${lastName}`,
            email: emailAddress
          });

          customerId = customer.id
        }

        await stripe.paymentIntents.update(paymentIntentId, {
          customer: customerId
        })

        const donationUpdate = {
          firstName: firstName,
          lastName: lastName,
          email: emailAddress
        }

        await db.collection('donations').doc(id).update(donationUpdate);
        status = 200;
        response.success = true;
      } catch (e) {
        if (e instanceof Error) {
          console.log(e)
          status = 500;
          response.error = e.message;
          throw (e);
        }
      } finally {
        res.status(status).send(response);
      }
    } else {
      console.log(req.body)
      console.error('Webhook did not have correct parameters')
      res.status(400).send('Incorrect parameters');
    }
  } else {
    res.status(405).send();
  }
})

