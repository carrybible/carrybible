import { https, logger } from 'firebase-functions'
import { isAuthen } from '../../shared/Permission'

const getUserPermission = https.onCall(async ({}, context) => {
  try {
    const userId = context.auth?.uid
    const authen = await isAuthen(userId || '')
    if (authen.success) {
      return { success: true, data: authen.permissions }
    } else return authen
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
    }
  }
})

export default getUserPermission
