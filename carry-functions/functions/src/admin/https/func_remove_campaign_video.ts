import { logger, runWith } from 'firebase-functions'
import { Service } from '../../shared'
import { MASTER_ROLES } from '../../shared/Constants'
import { isAuthen } from '../../shared/Permission'
import campaignServices from '../services/campaignServices'

const func_remove_campaign_video = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (!authen.success) return authen

      const userInfo: Carry.User = authen.user

      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')
      if (!flagMasterRole || !userInfo.organisation?.id) {
        return {
          success: false,
          isAuthen: true,
          message: 'Have no permission to access',
        }
      }

      if (!payload || !payload.id) {
        return {
          success: false,
          isAuthen: true,
          message: 'Invalid Data Request',
        }
      }

      return await campaignServices.removeVideoAttach(payload.id, userInfo)
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_remove_campaign_video
