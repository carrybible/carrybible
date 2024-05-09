import { firestore } from 'firebase-admin'
import { https } from 'firebase-functions'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { removeUndefinedParams, resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

type Card = {
  card: { number: string; exp_month: number; exp_year: number; cvc: string }
  details: {
    address?: {
      city?: string
      country?: string
      line1?: string
      line2?: string
      postal_code?: string
      state?: string
    }
    email?: string
    name?: string
    phone?: string
  }
  organisationId?: string
}

const func_add_card = https.onCall(async (params: Card, context) => {
  const stripe = StripeService
  const uid = context.auth?.uid || ''

  const { number, exp_month, exp_year, cvc } = params.card || {}
  const { address, email, name, phone } = params.details || {}
  const trackData = {
    card: { number, exp_month, exp_year, cvcLength: (cvc || '').length },
    details: { address, email, name, phone },
  }
  if (!number || !exp_month || !exp_year || !cvc || !name) {
    return resError('Missing card information', trackData)
  }

  const userRef = firestore().collection(collections.USERS).doc(uid)
  const userDoc = await userRef.get()
  const user = userDoc.data() as Carry.User

  try {
    const stripeData = await getUsersStripeId(user, params.organisationId)
    if (!stripeData.success) return stripeData
    const { customerId, options } = stripeData.data

    // Create CARD payment method
    const paymentIntent = await stripe.paymentMethods.create(
      {
        type: 'card',
        billing_details: removeUndefinedParams({ address, email, name, phone }),
        card: { number, exp_month, exp_year, cvc },
      },
      options,
    )

    if (paymentIntent) {
      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentIntent.id,
        {
          customer: customerId,
        },
        options,
      )
      return resSuccess('Add card successful', paymentMethod)
    }
  } catch (e: any) {
    return resError(`Cannot add card, ${e.message}`, trackData)
  }
  return resError(`Cannot add card!`, trackData)
})

export default func_add_card
