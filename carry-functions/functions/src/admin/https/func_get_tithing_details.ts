import { sub } from 'date-fns'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import campusServices from '../services/campusServices'
import fundServices from '../services/fundServices'
import organsationServices from '../services/organsationServices'
import { Utils, Service } from '../../shared'
import { getDonations } from '../services/donationServices'

const func_get_tithing_details = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      id: string
      organisationId?: string
    },
    context,
  ) => {
    const uid = context.auth?.uid
    try {
      let result: Response.FundModel | undefined = undefined

      const authen = await isAuthen(uid, true)
      if (!authen.success) return authen

      // const userInfo: Carry.User = await getDataFromFirestore({ data: uid, type: 'user' })
      const userInfo: Carry.User = authen.user
      const organisationId = payload.organisationId || userInfo.organisation?.id || ''
      const isSameOrg =
        (payload.organisationId && payload.organisationId === userInfo.organisation?.id) || !payload.organisationId

      const permissions = isSameOrg
        ? await getPermissions({
            permissions: ['view-fund', 'create-fund', 'update-fund', 'delete-fund'],
            user: userInfo,
          })
        : ['view-fund']

      if (!organisationId) {
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }
      }

      const fundsTask = fundServices.getFundDetail(payload.id, organisationId)
      const campusesTask = campusServices.getCampuses(organisationId)
      const organisationTask = organsationServices.getOrganisationInfo(organisationId)
      const [fund, campuses, organisation] = await Promise.all([fundsTask, campusesTask, organisationTask])

      if (!fund) return { success: false, data: result, message: 'Fund not found' }

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
      result = fundModel

      const donors = await getDonations(organisationId, undefined, fundModel.id)

      const dateInPast = sub(new Date(), { days: 30 })

      const donorInPast = donors.filter((x) => x.paidAt.toDate().getTime() < dateInPast.getTime())
      const donorInMonth = donors.filter((x) => x.paidAt.toDate().getTime() >= dateInPast.getTime())

      const totalDonor = _.compact(_.uniq(donors.map((x) => x.uid)))?.length ?? 0
      const totalDonorInPast = _.compact(_.uniq(donorInPast.map((x) => x.uid)))?.length ?? 0

      const totalDonorsIncrease = totalDonor - totalDonorInPast

      let totalDonateGrowth = 0
      if (donors?.length > 0) {
        totalDonateGrowth = _.sumBy(donorInMonth, 'amount')
      }
      const totalFundInPast = result.totalFunds - totalDonateGrowth

      const totalFundsIncreasedPercent =
        totalFundInPast === 0
          ? result.totalFunds > 0
            ? 100
            : 0
          : Math.round((totalDonateGrowth / totalFundInPast) * 100)
      result.totalDonorsIncrease = totalDonorsIncrease

      result.totalFundsIncreasedPercent = totalFundsIncreasedPercent
      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')

      if (!flagMasterRole && isSameOrg) {
        const allowCampus = Utils.getCampus(userInfo.organisation)
        result.campuses = _.filter(result.campuses ?? [], (campus) => {
          return allowCampus.includes(campus.id)
        })
      }

      return { success: true, permissions: permissions, data: result }
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

export default func_get_tithing_details
