import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getDataFromFirestore, getPermissions, isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import donationServices from '../services/donationServices'
import campaignServices from '../services/campaignServices'
import fundServices from '../services/fundServices'
import { Service } from '../../shared'

const func_get_user_donation_history = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
      sort?: {
        key: 'name' | 'amount' | 'date'
        order: 'asc' | 'desc'
      }
    },
    context,
  ) => {
    const uid: string | undefined = context.auth?.uid
    let result: Response.GivingHistory[] = []
    try {
      const authen = await isAuthen(uid)
      if (!authen.success) return authen

      const userInfo: Carry.User = authen.user
      const userProfile = (await getDataFromFirestore({ type: 'user', data: payload.id })) as Carry.User

      const permissions = await getPermissions({
        permissions: ['view-fund', 'view-campaign'],
        user: userInfo,
        target: {
          type: 'user',
          data: userProfile,
          scope: {
            orgnisationId: userInfo.organisation?.id,
            campusId: userInfo.organisation?.campusId,
          },
        },
      })

      if (!permissions.includes('view-fund') && !permissions.includes('view-campaign')) {
        return {
          success: false,
          isAuthen: false,
          message: 'Missing permission to view donation of user',
        }
      }

      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')
      if (!((flagMasterRole || userInfo.uid === payload.id) && userInfo.organisation?.id)) {
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }
      }

      const donationsTask = donationServices.getDonations(
        userInfo.organisation.id,
        undefined,
        undefined,
        undefined,
        undefined,
        payload.id,
      )
      const campaignsTask = campaignServices.getCampaigns(userInfo.organisation.id)
      const fundsTask = fundServices.getFunds(userInfo.organisation.id)

      const [donations, campaigns, funds] = await Promise.all([donationsTask, campaignsTask, fundsTask])

      donations.forEach((donation) => {
        if (donation.fundId) {
          const existFund = result.find((x) => x.id === donation.fundId)
          if (existFund) {
            existFund.amount = existFund.amount + donation.amount
            if (existFund.lastPaidAt < donation.paidAt.toDate().toISOString()) {
              existFund.lastPaidAt = donation.paidAt.toDate().toISOString()
            }
          } else {
            const fundInfo = funds.find((x) => x.id === donation.fundId)

            result.push({
              amount: donation.amount,
              currency: donation.currency,
              id: fundInfo?.id ?? '',
              image: fundInfo?.image ?? '',
              name: fundInfo?.name ?? '',
              lastPaidAt: donation.paidAt.toDate().toISOString(),
              type: 'fund',
            })
          }
        }
        if (donation.campaignId) {
          const existCampaign = result.find((x) => x.id === donation.campaignId)
          if (existCampaign) {
            existCampaign.amount = existCampaign.amount + donation.amount
            if (existCampaign.lastPaidAt < donation.paidAt.toDate().toISOString()) {
              existCampaign.lastPaidAt = donation.paidAt.toDate().toISOString()
            }
          } else {
            const campaignInfo = campaigns.find((x) => x.id === donation.campaignId)

            result.push({
              amount: donation.amount,
              currency: donation.currency,
              id: campaignInfo?.id ?? '',
              image: campaignInfo?.image ?? '',
              name: campaignInfo?.name ?? '',
              lastPaidAt: donation.paidAt.toDate().toISOString(),
              type: 'fund',
            })
          }
        }
      })

      if (payload.sort) {
        if (payload.sort.key === 'name') {
          result = result?.sort((n1, n2) => {
            const item1 = n1.name ?? ''
            const item2 = n2.name ?? ''
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
        if (payload.sort.key === 'date') {
          result = result?.sort((n1, n2) => {
            const item1 = n1.lastPaidAt
            const item2 = n2.lastPaidAt
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
        if (payload.sort.key === 'amount') {
          result = result?.sort((n1, n2) => {
            const item1 = n1.amount
            const item2 = n2.amount
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
      }

      return { success: true, data: result }
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
        error: error,
      }
    }
  },
)

export default func_get_user_donation_history
