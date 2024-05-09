import { format } from 'date-fns'
import { firestore, logger } from 'firebase-functions'
import { Service } from '../shared'
import { sendReceiptEmail } from '../shared/MainChimp'
import { getDataFromFirestore } from '../shared/Permission'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { StripCheckout } from '../stripe/func_create_checkout'
import collections from '../types/collections'

export default firestore.document('/organisations/{orgId}/donates/{donateId}').onUpdate(async (change, context) => {
  const { orgId } = context.params

  const nVal = change.after.data() as Carry.Donation
  const pVal = change.before.data() as Carry.Donation

  const currencySettingsDoc = await Service.Firebase.firestore()
    .collection(collections.SETTINGS)
    .doc('currencies')
    .get()
  const currencySettings = currencySettingsDoc.data()

  try {
    if (nVal.email !== pVal.email && nVal.email) {
      const userInfo: Carry.User = await getDataFromFirestore({ data: nVal.uid, type: 'user' })
      const orgInfo: Carry.Organisation = await getDataFromFirestore({ data: orgId, type: 'org' })

      const stripeData = await getUsersStripeId(userInfo, orgId)
      if (!stripeData.success) return stripeData
      const { customerId, options } = stripeData.data

      const checkoutId = nVal.transactionDetails.checkoutId
      if (checkoutId) {
        const checkoutDoc = await Service.Firebase.firestore().collection(collections.CHECKOUTS).doc(checkoutId).get()
        const checkoutData = checkoutDoc.data() as StripCheckout
        if (!checkoutData) {
          return
        }
        const info = checkoutData.requestOptions.info
        const textCurrency = (checkoutData.currency || '').toUpperCase()
        await sendReceiptEmail({
          userName: userInfo.name || '',
          email: nVal.email,
          orgName: orgInfo.name,
          amount: `${(checkoutData.amount_total || 0) / 100}`,
          currency: currencySettings?.[textCurrency]?.symbol || textCurrency,
          dateTime: format(new Date(checkoutData.created * 1000), 'yyyy-MM-dd (z)'),
          groupName: info?.groupName || '',
          campaignName: info?.eventName || '',
          card: '-',
        })
        return
      }

      const paymentId =
        nVal.transactionDetails.paymentId ||
        (nVal.transactionDetails.transactionObj?.paymentIntent || '').split('_secret_')?.[0] ||
        undefined

      if (paymentId) {
        const payment = await StripeService.paymentIntents.retrieve(paymentId, undefined, options)

        let paymentMethod: any = undefined

        try {
          const paymentMethods = await StripeService.customers.listPaymentMethods(customerId, undefined, options)
          paymentMethods.data.forEach((method) => {
            if (method.id === payment.payment_method) {
              paymentMethod = method
            }
          })
        } catch (e) {
          logger.info('Can get card info by api customers.listPaymentMethods', e)
        }
        const textCurrency = (payment.currency || '').toUpperCase()
        await sendReceiptEmail({
          userName: userInfo.name || '',
          email: nVal.email,
          orgName: orgInfo.name,
          amount: `${payment.amount / 100}`,
          currency: currencySettings?.[textCurrency]?.symbol || textCurrency,
          dateTime: format(new Date(payment.created * 1000), 'yyyy-MM-dd (z)'),
          groupName: payment.metadata.groupName || '',
          campaignName: payment.metadata.eventName || '',
          card: paymentMethod?.card?.last4 ? `•••• ${paymentMethod.card.last4}` : '-',
        })
      }
    }
  } catch (e) {
    logger.error(`Error sent receipt to user ${nVal.id}:`, e)
  }
  return
})
