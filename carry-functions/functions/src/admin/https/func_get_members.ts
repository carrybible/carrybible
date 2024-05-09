import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { Utils, Service } from '../../shared'
import { SCOPES } from '../../shared/Constants'
import { getPermissions, isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import { getUsersBaseOnScope } from '../firestoreHelper'

const get_members = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      page: number
      limit: number
      scope: string
      scopeId: string
      orders: [
        {
          key: 'name' | 'role' | 'joined'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    const uid: string | undefined = context.auth?.uid
    try {
      const result: Response.Member[] = []
      const scopeId = payload?.scopeId
      const scope = payload?.scope

      if (!scopeId || !scope || !SCOPES.includes(scope)) return { success: false, error: 'Scope not provide' }

      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo = authen.user
        if (payload.limit < 0 || payload.page <= 0) {
          return {
            success: false,
            isAuthen: true,
            message: 'Invalid data',
          }
        }

        const campusData = (
          await firestore()
            .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
            .collection(collections.CAMPUS)
            .get()
        ).docs.map((x) => x.data() as Carry.Campus)

        let userQueries = await getUsersBaseOnScope(scope, scopeId, userInfo)
        let campusOfUser = Utils.getCampus(userInfo.organisation)

        if (userInfo.organisation?.role === 'admin' || userInfo.organisation?.role === 'owner') {
          campusOfUser = campusData.map((x) => x.id)
        } else {
          userQueries = _.filter(userQueries, (item) => {
            const memberUser = Utils.getCampus(item.organisation)
            let flag = false
            for (const campusId of memberUser) {
              campusOfUser?.includes(campusId)
              flag = true
              break
            }
            return flag
          })
        }

        if (payload?.orders && payload?.orders?.length > 0) {
          payload?.orders.forEach((element) => {
            if (element.key === 'name') {
              userQueries = userQueries?.sort((n1, n2) => {
                const item_1 = n1.name ?? ''
                const item_2 = n2.name ?? ''
                if (element.order === 'asc') {
                  if (item_1 > item_2) return 1
                  if (item_1 < item_2) return -1
                  return 0
                } else if (element.order === 'desc') {
                  if (item_1 > item_2) return -1
                  if (item_1 < item_2) return 1
                  return 0
                }
                return 0
              })
            }
            if (element.key === 'role') {
              userQueries = userQueries?.sort((n1, n2) => {
                const item_1 = n1.organisation?.role ?? ''
                const item_2 = n2.organisation?.role ?? ''
                if (element.order === 'asc') {
                  if (item_1 > item_2) return 1
                  if (item_1 < item_2) return -1
                  return 1
                } else if (element.order === 'desc') {
                  if (item_1 > item_2) return -1
                  if (item_1 < item_2) return 1
                  return -1
                }
                return 0
              })
            }
            if (element.key === 'joined') {
              userQueries = userQueries?.sort((n1, n2) => {
                const item_1 = n1.created ?? ''
                const item_2 = n2.created ?? ''
                if (element.order === 'asc') {
                  if (item_1 > item_2) return 1
                  if (item_1 < item_2) return -1
                  return 1
                } else if (element.order === 'desc') {
                  if (item_1 > item_2) return -1
                  if (item_1 < item_2) return 1
                  return -1
                }
                return 0
              })
            }
          })
        }

        let data = userQueries
        const total = data.length
        if (payload?.search) {
          const searchText = payload?.search ?? ''
          const results = _.filter(data, (item) => {
            return (
              item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()) ||
              item.email?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
            )
          })
          data = results as Carry.User[]
        }
        data = _(data)
          .drop((payload.page - 1) * payload.limit)
          .take(payload.limit)
          .value()

        const members = data

        for (const member of members) {
          const tmpData = {
            ..._.pick(member, ['uid', 'name', 'image', 'email']),
            organisation: member.organisation,
            joinDate: new Date((member.created?.seconds || 0) * 1000).toISOString(),
            permissions: [] as string[],
          }
          const permissions = await getPermissions({
            permissions: [
              'view-members',
              'edit-profile-member',
              'remove-member',
              'change-role-member',
              'edit-profile',
              'remove-member',
            ],
            user: userInfo,
            target: {
              type: 'user',
              data: member,
              scope: {
                orgnisationId: userInfo.organisation?.id,
                campusId: userInfo.organisation?.campusId,
              },
            },
          })
          tmpData.permissions = permissions
          result.push(tmpData as Response.Member)
        }
        return { success: true, total: total, page: payload.page, limit: payload.limit, data: result }
      } else return authen
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
        error: error,
      }
    }
  },
)

export default get_members
