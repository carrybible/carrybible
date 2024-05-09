import { firestore } from 'firebase-admin'
import { logger } from 'firebase-functions'
import { removeUndefinedParams } from '../../shared/Utils'
import { StripCheckout } from '../../stripe/func_create_checkout'
import collections from '../../types/collections'

export const getDonations = async (
  orgId: string,
  campaignId?: string,
  fundId?: string,
  campusId?: string,
  groupId?: string,
  userId?: string,
) => {
  let result: Carry.Donation[] = []

  if (!orgId) return result

  let donationQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.DONATES)

  if (campaignId) donationQuery = donationQuery.where('campaignId', '==', campaignId)
  if (fundId) donationQuery = donationQuery.where('fundId', '==', fundId)
  if (campusId) donationQuery = donationQuery.where('campusId', '==', campusId)
  if (groupId) donationQuery = donationQuery.where('groupId', '==', groupId)
  if (userId) donationQuery = donationQuery.where('uid', '==', userId)
  const donationRef = await donationQuery.orderBy('paidAt', 'desc').get()
  result = donationRef.docs.map((x) => x.data() as Carry.Donation)
  return result
}

export const createDonation = async (
  userInfo: Carry.User,
  donationInfo: any, // Maybe checkout or payment
  amount: number,
  currency: string,
  campusId: string,
  groupId: string,
  campaignId?: string,
  fundId?: string,
  organisationId?: string,
) => {
  logger.info(
    'create donate',
    userInfo,
    donationInfo,
    amount,
    currency,
    campusId,
    groupId,
    campaignId,
    fundId,
    organisationId,
  )
  if (!organisationId) {
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }
  }

  if (!fundId && !campaignId) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid data',
      data: undefined,
    }
  }
  let donationData: Carry.Donation | undefined = undefined
  const orgId = organisationId

  // USER MUST BE MEMBER OF GROUP
  if (groupId && campusId && (campaignId || fundId)) {
    const groupDataSnap = await firestore()
      .doc(`${collections.ORGANISATIONS}/${orgId}`)
      .collection(collections.GROUPS)
      .doc(groupId)
      .get()
    const groupInfo = groupDataSnap.data() as Carry.Group
    if (!groupInfo.members.includes(userInfo.uid)) {
      return {
        success: false,
        isAuthen: true,
        message: 'Invalid data',
        data: undefined,
      }
    }

    // REMOVE: ACCEPT USER FOR ANY CAMPUS TO MAKE DONATE

    // const campusSnap = await firestore()
    //   .doc(`${collections.ORGANISATIONS}/${organisationId}`)
    //   .collection(collections.CAMPUS)
    //   .get()
    // const campuses = campusSnap.docs.map((x) => x.data() as Carry.Campus)

    // let campusOfUser: string[] = []

    // if (MASTER_ROLES.includes(userInfo.organisation?.role)) {
    //   campusOfUser = campuses.map((x) => x.id)
    // } else {
    //   campusOfUser = Utils.getCampus(userInfo.organisation)
    // }

    // if (!campusOfUser?.includes(campusId)) {
    //   return {
    //     success: false,
    //     isAuthen: true,
    //     message: 'Invalid data',
    //     data: undefined,
    //   }
    // }

    let payType: 'paymentIntent' | 'checkout' = 'paymentIntent'
    // Hanlde pay using payment intent
    const paymentIntent = donationInfo?.paymentIntent
    let donateId = (paymentIntent || '').split('_secret_')?.[0] || undefined

    // Handle pay using checkout
    if (!donateId) {
      payType = 'checkout'
      const checkoutInfo = donationInfo as StripCheckout
      donateId = checkoutInfo.payment_intent
    }

    const newDonationRef = firestore()
      .doc(`${collections.ORGANISATIONS}/${organisationId}`)
      .collection(collections.DONATES)
      .doc(donateId)

    if (campaignId) {
      const campaignSnap = await firestore()
        .doc(`${collections.ORGANISATIONS}/${organisationId}`)
        .collection(collections.CAMPAIGN)
        .doc(campaignId)
        .get()

      const campaignInfo = campaignSnap?.data() as Carry.Campaign

      if (!campaignInfo) {
        return {
          success: false,
          isAuthen: true,
          message: 'Campaign not found!',
          data: undefined,
        }
      }

      donationData = {
        id: newDonationRef.id,
        uid: userInfo.uid,
        campusId: campusId,
        groupId: groupId,
        campaignId: campaignId,
        organisationId: orgId,
        transactionDetails: {
          //Transaction object from Stripe
          payType,
          transactionObj: removeUndefinedParams(donationInfo),
          paymentId: donateId,
          checkoutId: payType === 'checkout' ? donationInfo.id : '',
        },
        type: 'campaign',
        amount: amount,
        currency: currency,
        paidAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      }
      await newDonationRef.set(donationData)
    }

    if (fundId) {
      const fundSnap = await firestore()
        .doc(`${collections.ORGANISATIONS}/${organisationId}`)
        .collection(collections.FUND)
        .doc(fundId)
        .get()

      const fundInfo = fundSnap?.data() as Carry.Fund

      if (!fundInfo) {
        return {
          success: false,
          isAuthen: true,
          message: 'Invalid data',
          data: undefined,
        }
      }

      donationData = {
        id: newDonationRef.id,
        uid: userInfo.uid,
        fundId: fundId,
        groupId: groupId,
        campusId: campusId,
        organisationId: orgId,
        transactionDetails: {
          //Transaction object from Stripe
          payType,
          transactionObj: donationInfo,
          paymentId: donateId,
          checkoutId: payType === 'checkout' ? donationInfo.id : '',
        },
        type: 'fund',
        amount: amount,
        currency: currency,
        paidAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      }
      await newDonationRef.set(donationData)
    }
  } else {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid data',
      data: undefined,
    }
  }
  if (donationData) {
    donationData = (
      await firestore()
        .doc(`${collections.ORGANISATIONS}/${organisationId}`)
        .collection(collections.DONATES)
        .doc(donationData.id)
        .get()
    ).data() as Carry.Donation
  }
  return {
    success: true,
    isAuthen: true,
    message: 'Add Donation success',
    data: donationData,
  }
}

export const updateDonation = async (
  donationId: string,
  email: string,
  userInfo: Carry.User,
  organisationId: string,
) => {
  if (!donationId || !email) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid model input',
      data: undefined,
    }
  }

  if (!organisationId) {
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }
  }

  const existDonationSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${organisationId}`)
    .collection(collections.DONATES)
    .doc(donationId)

  const donationDoc = await existDonationSnap.get()

  if (!donationDoc) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Donation',
    }
  }

  const existDonation = donationDoc.data() as Carry.Donation

  if (existDonation.uid !== userInfo.uid) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Donation',
    }
  }

  if (existDonation.email === email) {
    return {
      success: true,
      isAuthen: true,
      message: 'Update Donation success',
    }
  }

  await existDonationSnap.set(
    {
      email: email,
      updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    },
    { merge: true },
  )

  return {
    success: true,
    isAuthen: true,
    message: 'Update Donation success',
  }
}

export const parseToModel = (donation: Carry.Donation | undefined) => {
  if (!donation) return {} as Response.DonationModel

  const donationModel: Response.DonationModel = {
    id: donation.id,
    amount: donation.amount,
    currency: donation.currency,
    campaignId: donation.campaignId,
    organisationId: donation.organisationId,
    transactionDetails: donation.transactionDetails,
    type: donation.type,
    uid: donation.uid,
    campusId: donation.campusId,
    fundId: donation.fundId,
    groupId: donation.groupId,
    paidAt: donation.paidAt.toDate().toISOString(),
    created: donation.created.toDate().toISOString(),
  }
  return donationModel
}

export default {
  getDonations,
  createDonation,
  parseToModel,
  updateDonation,
}
