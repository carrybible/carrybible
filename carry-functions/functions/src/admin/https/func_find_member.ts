import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { SCOPE } from '../../shared/Constants'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { getUsersBaseOnScope } from '../firestoreHelper'
import { Service } from '../../shared'

interface responseUserType {
  uid: string
  name?: string
  email?: string
}
const find_member = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      ignoreExistUser?: boolean
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid
      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo: Carry.User = authen.user

        const permissions = await getPermissions({
          permissions: ['view-dashboard-members'],
          user: userInfo,
          target: {
            type: 'user',
            data: userInfo,
            scope: {
              orgnisationId: userInfo.organisation?.id,
              campusId: userInfo.organisation?.campusId,
            },
          },
        })

        let result: responseUserType[] = []
        if (permissions.includes('view-dashboard-members')) {
          const userQueries = await getUsersBaseOnScope(SCOPE.ORGANISATION, userInfo.organisation?.id ?? '', userInfo)
          result = userQueries
            .filter(
              (x) =>
                (x.name?.includes(payload.search ?? '') || x.email?.includes(payload.search ?? '')) &&
                (payload.ignoreExistUser
                  ? x.organisation?.role === 'member' || x.organisation?.role === 'leader'
                  : true),
            )
            .map((x) => x as responseUserType)
          result = _(result).take(20).value()
        } else {
          return {
            success: false,
            authen: true,
            message: 'Permission denied',
          }
        }
        return { success: true, data: result }
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

export default find_member
