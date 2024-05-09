import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import ErrorCode from '../../shared/ErrorCode'
import { Service } from '../../shared'

const func_delete_member = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      userId: string
    },
    context,
  ) => {
    try {
      const accessRoles = ['admin', 'owner']
      const accessDashboardRoles = ['campus-user', 'campus-leader', 'admin']
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success && accessRoles.includes(authen?.user?.organisation?.role ?? '')) {
        const userInfo: Carry.User = authen.user
        const permissions = await getPermissions({ user: userInfo })
        if (permissions?.includes('remove-member') && payload?.userId) {
          const userTargetRef = firestore().collection(`${collections.USERS}`).doc(`${payload.userId}`)
          const userTarget = (await userTargetRef.get()).data() as any
          if (
            userTarget &&
            userTarget.organisation?.id === userInfo.organisation?.id &&
            (!accessRoles.includes(userTarget.organisation?.role) ||
              (userTarget.organisation?.role !== 'owner' && userInfo.organisation?.role === 'owner'))
          ) {
            if (accessDashboardRoles.includes(userTarget.organisation.role)) {
              return {
                success: false,
                isAuthen: true,
                message: 'Please remove dashboard access for before deleting their account',
                errorCode: ErrorCode.PermissionDenied,
              }
            } else {
              await userTargetRef.update({
                organisation: firestore.FieldValue.delete(),
              })
              return {
                success: true,
                isAuthen: true,
                message: 'Remove member success',
              }
            }
          } else {
            return {
              success: false,
              isAuthen: true,
              message: 'Cannot delete user',
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

export default func_delete_member
