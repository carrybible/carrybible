import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'

const func_change_role_access = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      userId: string
      role: 'admin' | 'campus-user' | 'campus-leader' | 'member'
    },
    context,
  ) => {
    try {
      const accessRoles = ['admin', 'owner']
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success && accessRoles.includes(authen?.user?.organisation?.role ?? '')) {
        const userInfo: Carry.User = authen.user
        if (payload?.role && payload?.userId && payload?.userId !== userInfo.uid) {
          if (payload.role === 'admin' && userInfo.organisation?.role !== 'owner')
            return {
              success: false,
              isAuthen: false,
              message: 'Have no permission to access',
            }

          const userTargetRef = firestore().collection(`${collections.USERS}`).doc(`${payload.userId}`)
          const userTarget = (await userTargetRef.get()).data() as any
          if (userTarget?.organisation?.role && userTarget?.organisation?.role === payload?.role) {
            return {
              success: true,
              isAuthen: true,
              message: 'Assign role success',
            }
          }
          if (userTarget.organisation?.id === userInfo.organisation?.id) {
            await userTargetRef.update({
              ['organisation.role']: payload?.role ?? userTarget.organisation?.role,
            })
            return {
              success: true,
              isAuthen: true,
              message: 'Assign role success',
            }
          } else {
            return {
              success: false,
              isAuthen: false,
              message: 'Have no permission to access',
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

export default func_change_role_access
