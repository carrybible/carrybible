import * as functions from 'firebase-functions'
import Stripe from 'stripe'

const createStripeCheckout = functions.https.onCall(async (data, context) => {
  const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: '2022-11-15',
  })
  const host = functions.config().checkout.host

  let redirect = data.redirect || ''

  let cancelUrl = `${host}/subscribe/cancel?redirect=${redirect}`

  if (data.rep !== null && data.rep_email !== null) {
    cancelUrl += '&rep=' + data.rep + '&rep_email=' + data.rep_email
  }

  let price: string

  if (data.price !== undefined && data.price !== null && data.price !== '') {
    price = data.price
  } else {
    price = functions.config().stripe.price
  }

  console.log(`using price ${price}`)

  let params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: price,
      },
    ],
    success_url: `${host}/subscribe/success?redirect=${redirect}`,
    cancel_url: cancelUrl,
  }

  console.log(`using params ${params}`)

  if (data.org) {
    params.client_reference_id = data.org
  }

  const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create(params)

  return {
    id: checkoutSession.id,
    url: checkoutSession.url,
  }
})

export default createStripeCheckout
