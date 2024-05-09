import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { Utils, Service } from '../../shared'
import { isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'

const func_get_dashboard_account = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async ({}, context) => {
  try {

    const uid = context.auth?.uid
    const userRef = firestore().doc(`/users/${uid}`)
    const authen = await isAuthen(uid)
    if (!authen.success) return authen

    const userData: Carry.User = authen.user

    const permissions = authen.permissions

    if (permissions && permissions.includes('view-dashboard')) {
      let updatePermission = false
      if (userData.permission && userData.permission.length === permissions.length) {
        for (const permission of permissions) {
          if (!userData.permission.includes(permission)) {
            updatePermission = true
            break
          }
        }
      } else {
        updatePermission = true
      }
      if (updatePermission) {
        await userRef.set(
          {
            permission: permissions,
          },
          { merge: true },
        )
      }
      const campus = (
        await firestore()
          .doc(`${collections.ORGANISATIONS}/${userData.organisation?.id}`)
          .collection(collections.CAMPUS)
          .get()
      ).docs.map((x) => x.data() as Carry.Campus)

      let campusOfUser = Utils.getCampus(userData.organisation)
      if (userData.organisation?.role === 'admin' || userData.organisation?.role === 'owner') {
        campusOfUser = campus.map((x) => x.id)
      }
      const campusAccess = campus
        .filter((x) => campusOfUser.includes(x.id))
        .map((x) => ({
          id: x.id,
          name: x.name,
        }))

      return { success: true, data: { ...userData, permissions, campusAccess } }
    } else {
      return {
        success: false,
        isAuthen: false,
        message: 'Have no permission to access dashboard!',
      }
    }
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: 'Server error!',
    }
  }
})

export default func_get_dashboard_account
