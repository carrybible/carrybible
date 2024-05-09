import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getDataFromFirestore } from '../../shared/Permission'
import donationServices, { parseToModel } from '../services/donationServices'
import { Service } from '../../shared'

const func_make_donate = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      campaignId?: string
      fundId?: string
      campusId: string
      groupId: string
      amount: number
      currency: string
      transactionDetails: any
      organisationId: string
    },
    context,
  ) => {
    const uid = context.auth?.uid || ''
    return await makeDonate(uid, payload)
  },
)

export const makeDonate = async (
  uid: string,
  payload: {
    campaignId?: string
    fundId?: string
    campusId: string
    groupId: string
    amount: number
    currency: string
    transactionDetails: any
    organisationId: string
  },
) => {
  try {
    const userInfo: Carry.User = await getDataFromFirestore({ data: uid, type: 'user' })

    if (!payload || (!payload.campaignId && !payload.fundId)) {
      return {
        success: false,
        isAuthen: true,
        message: 'Invalid Data Request',
      }
    }

    const donationResult = await donationServices.createDonation(
      userInfo,
      payload.transactionDetails,
      payload.amount,
      payload.currency,
      payload.campusId,
      payload.groupId,
      payload.campaignId,
      payload.fundId,
      payload.organisationId,
    )
    if (donationResult?.success) {
      return {
        success: true,
        isAuthen: true,
        message: 'Add Donation success',
        data: parseToModel(donationResult.data),
      }
    } else {
      return donationResult
    }
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
    }
  }
}

export default func_make_donate
