import { RuntimeOptions, runWith, config } from 'firebase-functions'
import Stripe from 'stripe'
import { Service } from '../shared'

const db = Service.Firebase.firestore()
const stripe = new Stripe(config().stripe.secret, { apiVersion: '2022-11-15' })
const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
}

export interface Donation {
  id: string
  paymentIntentId: string
  customerId?: string
  subscriptionId?: string
  amount: number
  frequency: 'one-time' | 'monthly'
  firstName?: string
  lastName?: string
  email?: string
}

const prices: { [key: string]: string } = isDev
  ? {
      '1000': '',
      '2500': '',
      '5000': '',
      '10000': '',
    }
  : {
      '1000': '',
      '2500': '',
      '5000': '',
      '10000': '',
    }
const product = isDev ? '' : ''

/**
 * Sets up the payment to be accepted at www.carrybible.com/give
 */
export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    const id = req.body.id as string
    const amount = req.body.amount as number
    const frequency = req.body.frequency as string
    const firstName = req.body.first_name as string | undefined
    const lastName = req.body.last_name as string | undefined
    const emailAddress = req.body.email_address as string | undefined

    let response: { success: boolean; error?: string; data?: any } = {
      success: false,
    }
    let status = 400

    if (id && amount && frequency) {
      try {
        if (amount > 5) {
          if (frequency === 'one-time') {
            // one-off - stripe payment
            // create payment intent and then attach customer in next step (`func_carry_donate_update`)

            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: 'usd',
              payment_method_types: ['card'],
              metadata: {
                type: 'carry-donation',
                carry_id: id,
              },
            })

            //console.log(paymentIntent);

            if (paymentIntent.client_secret) {
              const donation: Donation = {
                id: id,
                paymentIntentId: paymentIntent.id,
                amount: amount,
                frequency: frequency,
              }

              await db.collection('donations').doc(id).set(donation)

              response.success = true
              response.data = {
                payment_intent_id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
              }
              status = 200
            } else {
              throw new Error('No payment intent secret')
            }
          } else if (frequency === 'monthly') {
            // monthly - stripe subscription
            // called at second step when we have contact info, no need for ui to call `func_carry_donate_update`

            if (!(firstName && lastName && emailAddress)) {
              // missing info
              console.log(req.body)
              throw new Error('Cannot setup subscription missing info')
            }

            let customerId

            // check if we have an existing customer on stripe to use
            const customerQuery = await stripe.customers.search({
              query: `email:\'${emailAddress}\'`,
            })

            if (customerQuery.data.length > 0) {
              customerId = customerQuery.data[0].id
            } else {
              const customer = await stripe.customers.create({
                name: `${firstName} ${lastName}`,
                email: emailAddress,
              })

              customerId = customer.id
            }

            // find an existing price to use
            let price = prices[amount.toString()]

            if (!price) {
              const query = `active:\'true\' AND product:\'${product}\' AND metadata[\'amount\']:\'${amount}\'`
              const priceQuery = await stripe.prices.search({
                query: query,
                limit: 1,
              })

              if (priceQuery.data.length > 0) {
                price = priceQuery.data[0].id
                console.log(`Found existing price ${price}`)
              } else {
                const newPrice = await stripe.prices.create({
                  currency: 'usd',
                  product: 'prod_NV8xdyr2CMWnmu',
                  unit_amount: amount,
                  recurring: {
                    interval: 'month',
                  },
                  tax_behavior: 'inclusive',
                  metadata: {
                    amount: amount.toString(),
                  },
                })
                price = newPrice.id
                console.log(`Created new price ${price}`)
              }
            }

            console.log(`Using price ${price}`)

            // create the subscription and expand the latest invoice to get payment intent
            const subscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [
                {
                  price: price,
                },
              ],
              payment_behavior: 'default_incomplete',
              payment_settings: { save_default_payment_method: 'on_subscription' },
              expand: ['latest_invoice.payment_intent'],
              metadata: {
                carry_id: id,
              },
            })

            const invoice = subscription.latest_invoice as Stripe.Invoice
            const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

            await stripe.paymentIntents.update(paymentIntent.id, {
              metadata: {
                type: 'carry-donation',
                carry_id: id,
              },
            })

            const donation: Donation = {
              id: id,
              customerId: customerId,
              subscriptionId: subscription.id,
              paymentIntentId: paymentIntent.id,
              amount: amount,
              frequency: frequency,
              email: emailAddress,
              firstName: firstName,
              lastName: lastName,
            }

            await db.collection('donations').doc(id).set(donation)

            response.success = true
            response.data = {
              payment_intent_id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
            }
            status = 200
          } else {
            // unknown frequency
            throw new Error('Unknown frequency')
          }
        } else {
          // invalid amount
          throw new Error('Invalid amount')
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e)
          status = 500
          response.error = e.message
          throw e
        }
      } finally {
        res.status(status).send(response)
      }
    } else {
      console.log(req.body)
      console.error('Webhook did not have correct parameters')
      res.status(400).send('Incorrect parameters')
    }
  } else {
    res.status(405).send()
  }
})
