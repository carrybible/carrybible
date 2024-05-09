import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Utils, Service } from '../../shared'

const func_create_campus_access = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      permission: 'view' | 'edit'
      campusId: string
      userId: string
    },
    context,
  ) => {
    try {
      const accessRoles = ['campus-leader', 'campus-user', 'admin', 'owner']
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success && accessRoles.includes(authen?.user?.organisation?.role ?? '')) {
        const userInfo: Carry.User = authen.user
        const permissions = await getPermissions({ user: userInfo })
        if (permissions?.includes('add-dashboard-campus-user')) {
          const campusRef = firestore()
            .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
            .collection(collections.CAMPUS)
            .doc(payload.campusId)
          const userRef = firestore().doc(`${collections.USERS}/${payload.userId}`)
          const campusTrackingRef = firestore()
            .doc(`${collections.USERS}/${payload.userId}`)
            .collection(collections.TRACKING)
          const [campusSnap, userDataSnap, campusTrackingSnap] = await Promise.all([
            campusRef.get(),
            userRef.get(),
            campusTrackingRef.get(),
          ])
          const campus = campusSnap.data() as Carry.Campus
          const userData = userDataSnap.data() as Carry.User
          const campusTracking = campusTrackingSnap.docs.map((x) => x.data() as Carry.Tracking)

          if (
            campus &&
            userData &&
            campus.organisationId === userInfo.organisation?.id &&
            userData.organisation?.id === userInfo.organisation?.id
          ) {
            let flagAddTracking = false
            if (userData.organisation.campusIds) {
              const existData = userData.organisation.campusIds.includes(campus.id)
              if (existData) {
                const index = _.findIndex(userData.organisation.campusIds, campus.id)
                if (campusTracking) {
                  const tracking = campusTracking.find((x) => x.campusId === campus.id)
                  if (tracking) {
                    await campusTrackingRef.doc(campus.id).set(
                      {
                        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
                      },
                      { merge: true },
                    )
                  } //Create new tracking if not exist
                  else flagAddTracking = true
                }
                userData.organisation.campusIds.splice(index, 1, campus.id)
              } else {
                flagAddTracking = true
                userData.organisation.campusIds.push(campus.id)
              }
            } else {
              flagAddTracking = true
              userData.organisation.campusIds = [campus.id]
              userData.organisation.campusIds.push(campus.id)
            }

            //Set campus access
            if (!Utils.getCampus(userData?.organisation).includes(campus.id)) {
              if (!userData.organisation.campusId) {
                userData.organisation.campusId = campus.id
              } else if (userData.organisation.campusIds) {
                userData.organisation.campusIds.push(campus.id)
              } else {
                userData.organisation.campusIds = [campus.id]
              }
            }

            const tasks: Promise<any>[] = []
            if (flagAddTracking) {
              const newTracking: Carry.Tracking = {
                addToLeaderBy: userInfo.uid,
                created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
                updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
                campusId: campus.id,
                type: 'campus',
              }
              const newTrackingRef = campusTrackingRef.doc(campus.id)
              tasks.push(newTrackingRef.set(newTracking))
            }
            tasks.push(
              userRef.set(
                {
                  organisation: userData.organisation,
                },
                { merge: true },
              ),
            )
            await Promise.all(tasks)
            return {
              success: true,
              isAuthen: true,
              message: 'Update permission success',
            }
          } else {
            return {
              success: false,
              isAuthen: true,
              message: 'Invalid data input with campus and user data',
            }
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

export default func_create_campus_access
