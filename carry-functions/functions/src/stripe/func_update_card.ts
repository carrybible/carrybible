import { firestore } from 'firebase-admin'
import { https } from 'firebase-functions'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { removeUndefinedParams, resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

const func_update_card = https.onCall(
  async (
    params: {
      cardId: string
      card: { exp_month: number; exp_year: number }
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
    },
    context,
  ) => {
    const uid = context.auth?.uid || ''

    const userRef = firestore().collection(collections.USERS).doc(uid)
    const userDoc = await userRef.get()
    const user = userDoc.data() as Carry.User

    const stripeData = await getUsersStripeId(user, params.organisationId)
    if (!stripeData.success) return stripeData
    const { options } = stripeData.data

    if (!params.cardId) {
      return resError('Missing card!', params)
    }

    const { exp_month, exp_year } = params.card || {}
    const { address, email, name, phone } = params.details || {}

    try {
      const paymentMethod = await StripeService.paymentMethods.update(
        params.cardId,
        {
          card: removeUndefinedParams({ exp_month, exp_year }),
          billing_details: removeUndefinedParams({ address, email, name, phone }),
        },
        options,
      )

      if (paymentMethod) {
        return resSuccess('Update cards successful!')
      }
    } catch (e: any) {
      return resError(`Update cards failed. ${e.message}`, params)
    }
    return resError(`Update cards failed.`, params)
  },
)

export default func_update_card
