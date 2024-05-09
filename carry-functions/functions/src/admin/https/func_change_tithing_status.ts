import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import fundServices from '../services/fundServices'
import { Service } from '../../shared'

const func_change_tithing_status = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
      status: 'active' | 'inactive'
    },
    context,
  ) => {
    try {
      const uid: string | undefined = context.auth?.uid

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

      if (!payload) {
        return {
          success: false,
          isAuthen: true,
          message: 'Invalid Data Request',
        }
      }

      return await fundServices.changeFundStatus(payload.id, userInfo.organisation.id, payload.status, userInfo)
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_change_tithing_status
