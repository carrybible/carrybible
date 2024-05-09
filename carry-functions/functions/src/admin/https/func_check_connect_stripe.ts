import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import Stripe from 'stripe'
import { Service } from '../../shared'
import { isAuthen } from '../../shared/Permission'
import StripeService from '../../shared/StripeService'
import { resError, resSuccess } from '../../shared/Utils'
import collections from '../../types/collections'

const func_check_connect_stripe = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (_, context) => {
  try {
    const uid = context.auth?.uid
    const authen = await isAuthen(uid)
    if (authen.success) {
      // Must be owner to connect to stripe
      if (!authen.permissions?.includes('connect-stripe'))
        return resError('You have no permission to connect to Stripe')

      const orgRef = firestore().collection(`${collections.ORGANISATIONS}`).doc(`${authen.user.organisation?.id}`)
      const orgDoc = orgRef.get()
      const orgData = (await orgDoc).data() as Carry.Organisation

      // Org must be enable giving to connect to stripe
      if (!orgData || !orgData.giving?.allowSetup)
        return resError('Your Organisation can not connect to Stripe, Please contact to admin for more information')

      // Missing account
      if (!orgData.giving?.stripeAccount) return resError('Missing account')

      let account: Stripe.Response<Stripe.Account> = orgData.giving?.stripeAccount

      const checkAccount = await StripeService.accounts.retrieve(account.id)

      let statusData: { [key: string]: string } = {}

      if (checkAccount?.details_submitted) statusData = { status: 'pending' }
      if (checkAccount?.charges_enabled) statusData = { status: 'connected' }

      if (statusData.status) {
        if (!orgData.giving.isConnected && statusData.status === 'connected') {
          orgRef.update({ giving: { ...orgData.giving, isConnected: true } })
        }
        return resSuccess('Success', statusData)
      }

      return resError('Not connected')
    } else return authen
  } catch (error: any) {
    logger.error(error)
    return resError("An unexpected error has occurred, we've let someone know! 🛠️")
  }
})

export default func_check_connect_stripe
