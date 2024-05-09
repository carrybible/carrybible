import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campaignServices from '../services/campaignServices'
import { Service } from '../../shared'

const func_get_giving_reports = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: {}, context) => {
  const uid: string | undefined = context.auth?.uid
  try {
    let result: Response.ReportGiving[] = []

    const authen = await isAuthen(uid)
    if (!authen.success) return authen

    const userInfo: Carry.User = authen.user
    const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')
    if (!flagMasterRole || !userInfo.organisation?.id) {
      return {
        success: false,
        isAuthen: true,
        message: 'Permission Denied',
      }
    }
    result = await campaignServices.getGivingReport(userInfo.organisation.id)
    return { success: true, data: result }
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
      error: error,
    }
  }
})

export default func_get_giving_reports
