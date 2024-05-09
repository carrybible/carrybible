import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import Stripe from 'stripe'
import { Service } from '../../shared'
import { isAuthen } from '../../shared/Permission'
import StripeService from '../../shared/StripeService'
import { resError, resSuccess } from '../../shared/Utils'
import collections from '../../types/collections'

const func_connect_stripe = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    {
      linkExpired,
      refreshUrl,
      returnUrl,
    }: {
      linkExpired: boolean
      refreshUrl: string
      returnUrl: string
    },
    context,
  ) => {
    try {
      const uid: string = context.auth?.uid || ''
      const authen = await isAuthen(uid)
      if (authen.success) {
        // Must be owner to connect to stripe
        if (!authen.permissions?.includes('connect-stripe')) {
          return resError('You have no permission to connect to Stripe', { uid })
        }

        const orgRef = firestore().collection(`${collections.ORGANISATIONS}`).doc(`${authen.user.organisation?.id}`)
        const orgDoc = orgRef.get()
        const orgData = (await orgDoc).data() as Carry.Organisation

        // Org must be enable giving to connect to stripe
        if (!orgData.giving?.allowSetup) {
          return resError('Your Organisation can not connect to Stripe, Please contact to admin for more information', {
            uid,
            orgId: authen.user.organisation?.id,
          })
        }

        let account: Stripe.Response<Stripe.Account> | undefined = orgData.giving?.stripeAccount
        if (!orgData.giving?.stripeAccount) {
          account = await StripeService.accounts.create({
            type: 'standard',
            email: authen.user.email,
          })
          await orgRef.update({
            giving: {
              ...orgData.giving,
              stripeAccount: account,
            },
          })
        }

        if (
          !orgData.giving?.accountLink ||
          linkExpired ||
          new Date().getTime() >= (orgData.giving?.accountLink?.expires_at || 0) * 1000
        ) {
          const accountLink = await StripeService.accountLinks.create({
            account: account?.id || '',
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
          })
          await orgRef.update({
            giving: {
              ...orgData.giving,
              stripeAccount: account,
              accountLink,
            },
          })

          return resSuccess('Redirect', accountLink)
        } else {
          return resError('Your organisation already linked', {
            uid,
            orgId: authen.user.organisation?.id,
          })
        }
      } else return authen
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_connect_stripe
