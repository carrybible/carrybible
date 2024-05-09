import * as functions from 'firebase-functions'
import Stripe from 'stripe'

const createStripeCustomerPortal = functions.https.onCall(async (data, context) => {
  const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: '2022-11-15',
  })

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: data.customer,
    return_url: data.redirect,
  })

  return {
    id: portalSession.id,
    url: portalSession.url,
  }
})

export default createStripeCustomerPortal
