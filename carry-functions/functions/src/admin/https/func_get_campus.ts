import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Utils, Service } from '../../shared'

async function getCampus(
  organisationId: string | undefined,
  payload: {
    search?: string | null
    page: number
    limit: number
    orders: [
      {
        key: 'church' | 'groups' | 'location'
        order: 'asc' | 'desc'
      },
    ]
  },
  filter: string[] | undefined,
  flagMasterRole?: boolean,
) {
  if (!organisationId) throw new Error(`Empty organisationId`)
  let queries: firestore.CollectionReference | firestore.Query = firestore()
    .doc(collections.ORGANISATIONS + `/${organisationId}`)
    .collection(collections.CAMPUS)
  if (payload.orders?.length > 0) {
    payload.orders.forEach((orderItem) => {
      switch (orderItem.key) {
        case 'church':
          queries = queries.orderBy(`name`, orderItem.order)
          break
        case 'groups':
          queries = queries.orderBy(`groupCount`, orderItem.order)
          break
        case 'location':
          queries = queries.orderBy(`region`, orderItem.order)
          break
        default:
          break
      }
    })
  }
  const campusRef = (await queries.get()).docs
  const total = campusRef.length

  let campuses = campusRef.map((x) => {
    const item = x.data() as Carry.Campus
    const campusRes: Response.Campus = {
      city: item.city,
      country: item.country,
      groupCount: item.groupCount ?? 0,
      id: item.id,
      image: item.image,
      name: item.name,
      organisationId: item.organisationId,
      owner: item.owner,
      region: item.region,
      state: item.state,
      permission: 'member',
    }
    return campusRes
  })

  if (filter && !flagMasterRole) {
    campuses = campuses.filter((cam) => filter?.includes(cam?.id || ''))
  }

  if (payload?.search) {
    const searchText = payload?.search ?? ''
    campuses = _.filter(campuses, (item) => {
      return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    })
  }
  campuses = _(campuses)
    .drop((payload.page - 1) * payload.limit)
    .take(payload.limit)
    .value()
  return { data: campuses, total: total }
}

const func_get_campus = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      page: number
      limit: number
      orders: [
        {
          key: 'church' | 'groups' | 'location'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    const uid = context.auth?.uid
    try {
      let result: Response.Campus[] = []

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
        let flagMasterRole = false
        if (userInfo.organisation?.role === 'admin' || userInfo.organisation?.role === 'owner') {
          flagMasterRole = true
        }
        const permissions = await getPermissions({ user: userInfo })
        let filterList: string[] | undefined
        if (!permissions?.includes('view-campus')) {
          filterList = Utils.getCampus(userInfo?.organisation)
        }

        const resultData = await getCampus(userInfo.organisation?.id, payload, filterList, flagMasterRole)
        result = resultData.data.map((x) => {
          if (flagMasterRole) {
            x.permission = 'leader'
            return x
          } else {
            if (userInfo.organisation?.role === 'campus-user') {
              x.permission = 'member'
            } else if (userInfo.organisation?.role === 'campus-leader') {
              x.permission = 'leader'
            }
            return x
          }
        })

        return { success: true, total: resultData.total, page: payload.page, limit: payload.limit, data: result }
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

export default func_get_campus
