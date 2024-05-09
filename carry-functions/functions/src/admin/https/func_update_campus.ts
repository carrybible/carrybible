import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'

const func_update_campus = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
      name: string
      city?: string
      state?: string
      country?: string
      region?: string
      avatar?: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo: Carry.User = authen.user
        const permissions = await getPermissions({ user: userInfo })
        if (permissions?.includes('edit-campus')) {
          const campusRef = firestore()
            .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
            .collection(collections.CAMPUS)
            .doc(payload.id)

          const campusData = (await campusRef.get()).data() as Carry.Campus

          if (campusData) {
            await campusRef.set(
              {
                name: payload.name || campusData.name,
                city: payload.city,
                state: payload.state,
                country: payload.country,
                region: payload.region,
                image: payload.avatar || campusData.image,
                updated: firestore.FieldValue.serverTimestamp(),
                updateBy: userInfo.uid,
              },
              { merge: true },
            )
          }
          return {
            success: true,
            isAuthen: true,
            message: 'Update campus success',
          }
        } else {
          return {
            success: false,
            isAuthen: false,
            message: 'Have no permission to access',
          }
        }
      } else return authen
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_update_campus
