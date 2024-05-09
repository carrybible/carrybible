import { firestore } from 'firebase-admin'
import { https } from 'firebase-functions'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

const func_get_cards = https.onCall(
  async (
    params: {
      organisationId?: string
    },
    context,
  ) => {
    const stripe = StripeService
    const uid = context.auth?.uid || ''

    const userRef = firestore().collection(collections.USERS).doc(uid)
    const userDoc = await userRef.get()
    const user = userDoc.data() as Carry.User
    try {
      const stripeData = await getUsersStripeId(user, params.organisationId)
      if (!stripeData.success) return stripeData
      const { customerId, options } = stripeData.data

      const paymentMethods = await stripe.customers.listPaymentMethods(customerId, { type: 'card' }, options)

      if (paymentMethods) {
        return resSuccess('Get cards successful!', paymentMethods.data)
      }
    } catch (e: any) {
      return resError(`Get cards failed. ${e.message}`)
    }
    return resError('Get cards failed.')
  },
)

export default func_get_cards
