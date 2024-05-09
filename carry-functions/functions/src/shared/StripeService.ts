import { firestore } from 'firebase-admin'
import { config } from 'firebase-functions'
import Stripe from 'stripe'
import collections from '../types/collections'
import { resError, resSuccess } from './Utils'

const StripeService = new Stripe(config().stripe.secret, { apiVersion: '2022-11-15' })

export const getUsersStripeId: (
  user: Carry.User,
  organisationId?: string,
) => Promise<{
  success: boolean
  message: string
  data: {
    customerId: string
    options: {
      stripeAccount: string
    }
  }
}> = async (user, organisationId) => {
  let customerId = user.stripeCustomerIds?.[organisationId || user.organisation?.id || '']

  let options: Stripe.RequestOptions | undefined = undefined
  // User must belong to a Org and that Org must be finish integrate with Stripe
  const orgRef = firestore()
    .collection(`${collections.ORGANISATIONS}`)
    .doc(`${organisationId || user.organisation?.id}`)
  const orgDoc = orgRef.get()
  const orgData = (await orgDoc).data() as Carry.Organisation

  if (orgData?.giving?.stripeAccount?.id) {
    const stripeAccount = await StripeService.accounts.retrieve(orgData.giving.stripeAccount.id)
    if (stripeAccount?.charges_enabled) {
      options = { stripeAccount: orgData.giving.stripeAccount.id }
    }
  }

  if (!options || !orgData) {
    return resError('Your Organisation is not ready for Giving yet!')
  }

  if (!customerId) {
    // Create customer on stripe if not exist
    const customer = await StripeService.customers.create(
      {
        name: user.name,
        email: user.email,
        description: `Stripe account of user ${user.uid} for ${orgData.name}(${orgData.id})`,
      },
      options,
    )
    customerId = customer.id
    // Update data to User
    const userRef = firestore().collection(`${collections.USERS}`).doc(user.uid)
    await userRef.update({ stripeCustomerIds: { ...(user.stripeCustomerIds || {}), [orgData.id]: customerId } })
  }

  return resSuccess('Found customer', {
    customerId,
    options,
  })
}

export default StripeService
