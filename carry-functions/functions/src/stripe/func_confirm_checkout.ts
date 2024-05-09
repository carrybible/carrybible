import * as admin from 'firebase-admin'
import { runWith } from 'firebase-functions'
import { makeDonate } from '../admin/https/func_make_donate'
import { Service } from '../shared'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'
import { StripCheckout } from './func_create_checkout'

const func_confirm_checkout = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  const { code } = req.body as {
    code: string
  }

  const checkouts = await admin.firestore().collection(collections.CHECKOUTS).where('identifierCode', '==', code).get()
  if (!checkouts.docs?.[0]?.exists) {
    res.json(resError('Checkout not found!', code))
    return
  }

  const checkoutDoc = checkouts.docs[0]
  const checkoutData = checkoutDoc.data() as StripCheckout

  const userRef = admin.firestore().collection(collections.USERS).doc(checkoutData.requestOptions.uid)
  const userDoc = await userRef.get()
  const user = userDoc.data() as Carry.User
  const organisationId = checkoutData.requestOptions.info.organisationId || ''

  const stripeData = await getUsersStripeId(user, organisationId)
  if (!stripeData.success) {
    res.json(stripeData)
    return
  }
  const { options } = stripeData.data

  const session = await StripeService.checkout.sessions.retrieve(checkoutData.id, options)

  const donateDocs = await admin
    .firestore()
    .collection(collections.ORGANISATIONS)
    .doc(checkoutData.requestOptions.info.organisationId)
    .collection(collections.DONATES)
    .where('transactionDetails.checkoutId', '==', 'id')
    .get()

  if (donateDocs.docs.length > 0) {
    const donateData = donateDocs.docs[0].data
    res.status(200).json(resSuccess('Add Donation success', donateData))
    return
  }

  if (!session) {
    res.json(resError('Session not found!', code))
    return
  }

  if (session.status === 'expired') {
    res.json(resError('Checkout expired!', code))
    return
  }

  if (session.status === 'open') {
    res.json(resError('Checkout unpaid', code))
    return
  }

  if (session.status === 'complete' && session.payment_status === 'paid') {
    await checkoutDoc.ref.update({ ...session })

    const info = checkoutData.requestOptions.info
    const result = await makeDonate(user.uid, {
      amount: (checkoutData.amount_total || 0) / 100,
      currency: checkoutData.requestOptions.currency,
      ...info,
      ...(info.type === 'campaign' ? { campaignId: info.eventId } : { fundId: info.eventId }),
      transactionDetails: session,
    })
    res.json(result)
  } else {
    res.json(resError('Unknown status', code))
  }
})

export default func_confirm_checkout
