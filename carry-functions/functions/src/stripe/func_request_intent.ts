import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { Service } from '../shared'
import StripeService, { getUsersStripeId } from '../shared/StripeService'
import { removeUndefinedParams, resError, resSuccess } from '../shared/Utils'
import collections from '../types/collections'

const func_request_intent = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    params: {
      amount: number
      currency: string
      info: {
        type: 'campaign' | 'tithe'
        eventId: string
        eventName: string
        groupId: string
        groupName: string
        campusId: string
      }
    },
    context,
  ) => {
    const uid = context.auth?.uid || ''
    return await genIntent(uid, params.amount, params.currency, params.info)
  },
)

export const genIntent = async (
  uid: string,
  amount: number,
  currency: string,
  info: {
    type: 'campaign' | 'tithe'
    eventId: string
    eventName: string
    groupId: string
    groupName: string
    campusId?: string
    campusName?: string
    organisationId?: string // Support donate from guest
  },
) => {
  const userRef = firestore().collection(collections.USERS).doc(uid)
  const userDoc = await userRef.get()
  const user = userDoc.data() as Carry.User
  const organisationId = info.organisationId || user.organisation?.id || ''
  try {
    const stripeData = await getUsersStripeId(user, info.organisationId)
    if (!stripeData.success) return stripeData
    const { customerId, options } = stripeData.data

    const ephemeralKey = await StripeService.ephemeralKeys.create(
      { customer: customerId },
      { ...options, apiVersion: '2022-08-01' },
    )

    const defaultFees = await (
      await firestore().collection(`${collections.SYSTEM_SETTINGS}`).doc('givingFee').get()
    ).data()

    if (info.campusId) {
      try {
        const campusData = (await (
          await firestore()
            .collection(`${collections.ORGANISATIONS}`)
            .doc(organisationId)
            .collection(collections.CAMPUS)
            .doc(info.campusId)
            .get()
        ).data()) as Carry.Campus
        info.campusName = campusData?.name || ''
      } catch (error: any) {
        logger.error('Campus not found', uid, amount, currency, info)
      }
    }

    const customFee = await (
      await firestore()
        .collection(`${collections.SYSTEM_SETTINGS}`)
        .doc('givingFee')
        .collection(collections.CUSTOM_FEE)
        .doc(organisationId)
        .get()
    ).data()

    const fee = customFee?.[currency.toUpperCase()] | defaultFees?.[currency.toUpperCase()] | 0

    const setupIntent = await StripeService.paymentIntents.create(
      {
        amount: amount,
        currency: currency.toLowerCase(),
        customer: customerId,
        automatic_payment_methods: {
          enabled: false,
        },
        application_fee_amount: fee,
        metadata: removeUndefinedParams(info),
      },
      options,
    )

    await userRef.update({
      stripeIntents: firestore.FieldValue.arrayUnion(setupIntent.client_secret),
    })

    return resSuccess('Create intent success', {
      setupIntent: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
    })
  } catch (e: any) {
    return resError(`Cannot generate intent, ${e.message}`, uid)
  }
}

export default func_request_intent
