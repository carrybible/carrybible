import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'

const func_create_campus = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
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
        if (permissions?.includes('create-campus')) {
          const newCampusRef = firestore()
            .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
            .collection(collections.CAMPUS)
            .doc()
          const campusData = {
            id: newCampusRef.id,
            name: payload.name,
            image: payload.avatar,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            region: payload.region,
            organisationId: userInfo.organisation?.id,
            //who create this campus, just for record
            owner: userInfo.uid,
            memberCount: 0,
            members: [],
            groups: [],
            created: firestore.FieldValue.serverTimestamp(),
            updated: firestore.FieldValue.serverTimestamp(),
            createBy: userInfo.uid,
          }
          await newCampusRef.set(campusData)
          return {
            success: true,
            isAuthen: true,
            message: 'Add campus success',
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

export default func_create_campus
