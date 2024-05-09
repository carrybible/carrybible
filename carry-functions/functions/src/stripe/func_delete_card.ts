import { firestore } from 'firebase-admin'
import { https } from 'firebase-functions'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

const func_delete_card = https.onCall(
  async (
    params: {
      cardId: string
      organisationId?: string
    },
    context,
  ) => {
    const stripe = StripeService
    const uid = context.auth?.uid || ''

    if (!params.cardId) {
      return resError('Missing card!', params)
    }

    const userRef = firestore().collection(collections.USERS).doc(uid)
    const userDoc = await userRef.get()
    const user = userDoc.data() as Carry.User

    const stripeData = await getUsersStripeId(user, params.organisationId)
    if (!stripeData.success) return stripeData
    const { options } = stripeData.data

    try {
      const paymentMethod = await stripe.paymentMethods.detach(params.cardId, {}, options)
      if (paymentMethod) {
        return resSuccess('Delete cards successful!')
      }
    } catch (e: any) {
      return resError(`Delete cards failed. ${e.message}`, params)
    }
    return resError(`Delete cards failed.`, params)
  },
)

export default func_delete_card
