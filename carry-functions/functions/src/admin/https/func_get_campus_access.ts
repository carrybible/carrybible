import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { firestore } from 'firebase-admin'
import { isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import { Utils, Service } from '../../shared'

const func_get_campus_access = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      userId: string
      search?: string | null
      page: number
      limit: number
      orders: [
        {
          key: 'campus' | 'location' | 'addBy'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid
      let result: Response.MemberCampusAccess[] = []

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

        const userData = (await firestore().doc(`${collections.USERS}/${payload.userId}`).get()).data() as Carry.User
        if (
          !userData ||
          !(userData.organisation?.id === userInfo.organisation?.id) ||
          !(userData.organisation?.campusIds || userData.organisation?.campusId)
        ) {
          return { success: true, total: 0, page: payload.page, limit: payload.limit, data: result }
        }

        const campusTrackingRef = firestore()
          .doc(`${collections.USERS}/${userData.uid}`)
          .collection(collections.TRACKING)
          .get()

        const campusQueriesRef = firestore()
          .doc(`${collections.ORGANISATIONS}/${userData.organisation?.id}`)
          .collection(collections.CAMPUS)
          .get()

        const [campusSnap, campusTrackingSnap] = await Promise.all([campusQueriesRef, campusTrackingRef])
        const campus = campusSnap.docs.map((x) => x.data() as Carry.Campus)

        const campusTracking = campusTrackingSnap.docs.map((x) => x.data() as Carry.Tracking)
        let createByIds = campusTracking?.filter((x) => x.type === 'campus').map((x) => x.addToLeaderBy)

        if (createByIds) {
          createByIds = _.compact(createByIds)
        }

        let userDatas: Carry.User[] = [] as Carry.User[]
        if (createByIds && createByIds.length > 0) {
          const userSnap = await firestore()
            .collection(`${collections.USERS}`)
            .where('organisation.id', '==', userData.organisation?.id)
            .where('uid', 'in', createByIds)
            .get()
          userDatas = userSnap.docs.map((x) => x.data() as Carry.User)
        }

        const total = Utils.getCampus(userData.organisation)?.length
        let tmpResult: Response.MemberCampusAccess[] = []
        Utils.getCampus(userData.organisation)?.forEach((element) => {
          const tmpCampus = campus.find((x) => x.id === element)
          const tracking = campusTracking?.find((x) => x.campusId === element && x.type === 'campus')
          const createBy = tracking ? userDatas.find((x) => x.uid === tracking.addToLeaderBy) : undefined
          tmpResult.push({
            campusId: element,
            location: `${(tmpCampus?.city ?? '') + (tmpCampus?.city ? ',' : '')}${tmpCampus?.country ?? ''}`,
            name: tmpCampus?.name,
            createById: tracking?.addToLeaderBy ?? '',
            createBy: createBy?.name ?? '',
          })
        })

        if (payload?.orders?.length > 0) {
          payload?.orders.forEach((element) => {
            if (element.key === 'campus') {
              tmpResult = tmpResult?.sort((n1, n2) => {
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
            if (element.key === 'location') {
              tmpResult = tmpResult?.sort((n1, n2) => {
                const item_1 = n1.location
                const item_2 = n1.location
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
            if (element.key === 'addBy') {
              tmpResult = tmpResult?.sort((n1, n2) => {
                const item_1 = n1.createBy
                const item_2 = n1.createBy
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

        let data = tmpResult
        if (payload?.search) {
          const searchText = payload?.search ?? ''
          const results = _.filter(data, (item) => {
            return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
          })
          data = results as Response.MemberCampusAccess[]
        }
        data = _(data)
          .drop((payload.page - 1) * payload.limit)
          .take(payload.limit)
          .value()

        result = data
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

export default func_get_campus_access
