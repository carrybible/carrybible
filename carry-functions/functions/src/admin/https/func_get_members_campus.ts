import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'

import { Service, Utils } from '../../shared'
import { CAMPUSACCESS, ROLE_BASE } from '../../shared/Constants'
import { getPermissions, isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'

const func_get_members_campus = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      page: number
      limit: number
      orders: [
        {
          key: 'name' | 'role' | 'dashboardAccess'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid

      const result: Response.MemberCampus[] = []

      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo: Carry.User = authen.user
        if (payload.limit < 0 || payload.page <= 0) {
          return {
            success: false,
            isAuthen: true,
            message: 'Invalid data',
          }
        }

        const userQueriesRef = firestore()
          .collection(collections.USERS)
          .where('organisation.id', '==', userInfo.organisation?.id)
          .where('organisation.role', 'in', ['campus-leader', 'campus-user', 'admin', 'owner'])
          .get()
        const campusRef = firestore()
          .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
          .collection(collections.CAMPUS)
          .get()

        const [userQueriesSnap, campusSnap] = await Promise.all([userQueriesRef, campusRef])
        let userQueries = userQueriesSnap.docs.map((x) => x.data() as Carry.User)
        const campus = campusSnap.docs.map((x) => x.data() as Carry.Campus)

        let campusOfUser = Utils.getCampus(userInfo.organisation)

        if (userInfo.organisation?.role === 'admin' || userInfo.organisation?.role === 'owner') {
          campusOfUser = campus.map((x) => x.id)
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

        const total = userQueries.length

        if (payload?.orders?.length > 0) {
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
                const item_2 = n1.organisation?.role ?? ''
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
            if (element.key === 'dashboardAccess') {
              userQueries = userQueries?.sort((n1, n2) => {
                const masterRoles = ['admin', 'owner']
                const campusData1 = masterRoles.includes(n1.organisation?.role ?? '')
                  ? campus
                  : campus.filter((x) => Utils.getCampus(n1.organisation).includes(x.id))
                const campusData2 = masterRoles.includes(n2.organisation?.role ?? '')
                  ? campus
                  : campus.filter((x) => Utils.getCampus(n2.organisation).includes(x.id))
                const item_1 = masterRoles.includes(n1.organisation?.role ?? '')
                  ? CAMPUSACCESS.ALLACCESS
                  : campusData1.map((x) => x.name).join(', ')
                const item_2 = masterRoles.includes(n2.organisation?.role ?? '')
                  ? CAMPUSACCESS.ALLACCESS
                  : campusData2.map((x) => x.name).join(', ')
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
          const masterRoles = ['admin', 'owner']
          const campusData = masterRoles.includes(member.organisation?.role ?? '')
            ? campus
            : campus.filter((x) => Utils.getCampus(member.organisation).includes(x.id))
          const tmpData = {
            ..._.pick(member, ['uid', 'name', 'image', 'email']),
            dashboardAccess:
              member.organisation?.role === ROLE_BASE.ADMIN || member.organisation?.role === ROLE_BASE.OWNER
                ? CAMPUSACCESS.ALLACCESS
                : campusData.map((x) => x.name).join(', '),
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
          result.push(tmpData as Response.MemberCampus)
        }
        return { success: true, total: total, page: payload.page, limit: payload.limit, data: result }
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

export default func_get_members_campus
