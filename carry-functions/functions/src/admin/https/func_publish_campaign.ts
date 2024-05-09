import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campaignServices from '../services/campaignServices'
import { Timestamp } from 'firebase-admin/firestore'
import { Service } from '../../shared'

const func_publish_campaign = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
      campusIds?: string[]
      groupIds?: string[]
      startDate: string
      endDate: string
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

      if (!payload || (!payload.campusIds && !payload.groupIds)) {
        return {
          success: false,
          isAuthen: true,
          message: 'Invalid Data Request',
        }
      }
      const startDateTime = new Date(payload.startDate)
      const endDateTime = new Date(payload.endDate)

      if (payload.campusIds && payload.campusIds.length > 0) {
        return await campaignServices.publishCampaign(
          payload.id,
          userInfo.organisation.id,
          payload.campusIds,
          Timestamp.fromDate(startDateTime),
          Timestamp.fromDate(endDateTime),
          userInfo,
        )
      }

      if (payload.groupIds && payload.groupIds.length > 0){
        return await campaignServices.publishCampaignWithGroups(
          payload.id,
          userInfo.organisation.id,
          payload.groupIds,
          Timestamp.fromDate(startDateTime),
          Timestamp.fromDate(endDateTime),
          userInfo,
        )
      }

      return {
        success: false,
        isAuthen: true,
        message: 'Invalid Data Request',
      }
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_publish_campaign
