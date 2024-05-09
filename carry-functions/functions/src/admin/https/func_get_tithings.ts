import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campusServices from '../services/campusServices'
import fundServices from '../services/fundServices'
import organsationServices from '../services/organsationServices'
import { Utils, Service } from '../../shared'

const func_get_tithings = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      page?: number
      limit?: number
      status?: 'active' | 'inactive'
      campusId?: string
      organisationId?: string
      sort: {
        key: 'name' | 'goal'
        order: 'asc' | 'desc'
      }
    },
    context,
  ) => {
    const uid = context.auth?.uid
    const page = payload.page ?? 1
    const limit = payload.limit ?? 999
    try {
      let result: Response.FundModel[] | undefined = []

      const authen = await isAuthen(uid, true)
      if (!authen.success) return authen

      // const userInfo: Carry.User = await getDataFromFirestore({ data: uid, type: 'user' })
      const userInfo: Carry.User = authen.user
      const organisationId = payload.organisationId || userInfo.organisation?.id || ''
      const isSameOrg =
        (payload.organisationId && payload.organisationId === userInfo.organisation?.id) || !payload.organisationId

      if (!organisationId) {
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }
      }

      const fundsTask = fundServices.getFunds(organisationId, payload?.campusId, payload?.status)
      const campusesTask = campusServices.getCampuses(organisationId)
      const organisationTask = organsationServices.getOrganisationInfo(organisationId)
      const [funds, campuses, organisation] = await Promise.all([fundsTask, campusesTask, organisationTask])

      let allCampusIds: string[] = []
      funds.forEach((x) => (allCampusIds = allCampusIds.concat(x.campusIds ?? [])))
      allCampusIds = _.compact(_.uniq(allCampusIds))

      let fundList = funds
      if (payload?.sort) {
        if (payload.sort.key === 'name') {
          fundList = fundList?.sort((n1, n2) => {
            const item1 = n1.name ?? ''
            const item2 = n2.name ?? ''
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort.order === 'asc' ? 1 : payload.sort.order === 'desc' ? -1 : 0)
            )
          })
        }
        if (payload.sort.key === 'goal') {
          fundList = fundList?.sort((n1, n2) => {
            const item1 = n1.totalFunds
            const item2 = n2.totalFunds
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort.order === 'asc' ? 1 : payload.sort.order === 'desc' ? -1 : 0)
            )
          })
        }
      }

      result = funds?.map((fund) => {
        const fundModel = fundServices.parseToModel(fund)
        if (fund.campusIds?.length > 0) {
          const campusInfo = campuses?.filter((x) => fund.campusIds.includes(x.id)) ?? []
          fundModel.campuses = campusInfo.map((x) => {
            return {
              id: x.id,
              name: x.name,
              avatar: x.image,
            }
          })
        }
        fundModel.organization = {
          id: fund.organizationId,
          name: organisation?.name ?? '',
        }
        return fundModel
      })

      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')

      if (!flagMasterRole && isSameOrg) {
        const allowCampus = Utils.getCampus(userInfo.organisation)
        result = _.filter(result, (fund) => {
          fund.campuses = _.filter(fund.campuses ?? [], (campus) => {
            return allowCampus.includes(campus.id)
          })

          return fund.campuses.length > 0
        })
      }

      if (payload?.search) {
        const searchText = payload?.search ?? ''
        result = _.filter(result, (item) => {
          return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
        })
      }
      const total = result.length
      result = _(result)
        .drop((page - 1) * limit)
        .take(limit)
        .value()
      return { success: true, page: page, limit: limit, total, data: result }
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

export default func_get_tithings
