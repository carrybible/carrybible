import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campusServices from '../services/campusServices'
import fundServices from '../services/fundServices'
import { Service } from '../../shared'

const func_get_campuses_with_tithing = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: {}, context) => {
  const uid: string | undefined = context.auth?.uid
  try {
    const result: Response.CampusWithTithing[] = []

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

    const campusAddedTask = fundServices.getCampusOfFunds(userInfo.organisation.id)
    const campusesTask = campusServices.getCampuses(userInfo.organisation.id)
    const [campusAdded, campuses] = await Promise.all([campusAddedTask, campusesTask])

    if (campusAdded && campusAdded.length > 0) {
      campusAdded.forEach((campus) => {
        const originCampus = campuses.find((x) => x.id === campus.id)
        if (originCampus) {
          campus.image = originCampus.image
          campus.name = originCampus.name
          result.push(campus)
        }
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
})

export default func_get_campuses_with_tithing
