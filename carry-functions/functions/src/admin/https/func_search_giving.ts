import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campaignServices from '../services/campaignServices'
import fundServices from '../services/fundServices'
import { Service } from '../../shared'

const func_search_giving = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
    },
    context,
  ) => {
    const uid = context.auth?.uid
    try {
      let result: Response.GivingResponse[] = []

      const authen = await isAuthen(uid)
      if (!authen.success) return authen

      const userInfo: Carry.User = authen.user
      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')
      if (!flagMasterRole || !userInfo.organisation?.id)
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }

      const campaignsTask = campaignServices.getCampaigns(userInfo.organisation.id)
      const fundsTask = fundServices.getFunds(userInfo.organisation.id)

      const [campaigns, funds] = await Promise.all([campaignsTask, fundsTask])

      if (campaigns?.length > 0) {
        const givingCampaigns = campaigns.map((x) => {
          const obj = {
            id: x.id,
            type: 'campaign',
            name: x.name,
            image: x.image,
          } as Response.GivingResponse
          return obj
        })
        if (givingCampaigns?.length > 0) {
          result = result.concat(givingCampaigns)
        }
      }

      if (funds?.length > 0) {
        const givingCampaigns = funds.map((x) => {
          const obj = {
            id: x.id,
            type: 'fund',
            name: x.name,
            image: x.image,
          } as Response.GivingResponse
          return obj
        })
        if (givingCampaigns?.length > 0) {
          result = result.concat(givingCampaigns)
        }
      }
      if (payload?.search) {
        const searchText = payload?.search ?? ''
        result = _.filter(result, (item) => {
          return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
        })
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

export default func_search_giving
