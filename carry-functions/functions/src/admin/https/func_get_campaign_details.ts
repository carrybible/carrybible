import { sub } from 'date-fns'
import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { Service, Utils } from '../../shared'
import { MASTER_ROLES } from '../../shared/Constants'
import { getPermissions, isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import campaignServices from '../services/campaignServices'
import campusServices from '../services/campusServices'
import donationServices, { getDonations } from '../services/donationServices'
import organsationServices from '../services/organsationServices'

const func_get_campaign_details = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      organisationId: string
      id: string
    },
    context,
  ) => {
    const uid = context.auth?.uid
    try {
      let result: Response.CampaignModel | undefined = undefined

      const authen = await isAuthen(uid, true)
      if (!authen.success) return authen

      // const userInfo: Carry.User = await getDataFromFirestore({ data: uid, type: 'user' })
      const userInfo: Carry.User = authen.user

      const organisationId = payload.organisationId || userInfo.organisation?.id
      const isSameOrg = (organisationId && organisationId === userInfo.organisation?.id) || !organisationId
      const permissions = isSameOrg
        ? await getPermissions({
            permissions: ['view-campaign', 'create-campaign', 'update-campaign', 'delete-campaign'],
            user: userInfo,
          })
        : ['view-campaign']

      if (!organisationId) {
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }
      }

      const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')

      const campaignsTask = campaignServices.getCampaignDetail(payload.id, organisationId)
      const myDonationTask = donationServices.getDonations(
        organisationId,
        payload.id,
        undefined,
        undefined,
        undefined,
        userInfo.uid,
      )
      const campusesTask = campusServices.getCampuses(organisationId)
      const organisationTask = organsationServices.getOrganisationInfo(organisationId)
      const [campaign, campuses, organisation, myDonation] = await Promise.all([
        campaignsTask,
        campusesTask,
        organisationTask,
        myDonationTask,
      ])

      if (!campaign) return { success: false, data: result, message: 'Campaign not found' }

      if (!flagMasterRole && isSameOrg) {
        // Custom get campaign, don't check access
        const allowCampus = Utils.getCampus(userInfo.organisation)
        let allowAccess = false
        for (const campusId of allowCampus) {
          if (campaign.campusIds.includes(campusId)) {
            allowAccess = true
            break
          }
        }
        if (!allowAccess) {
          return { success: false, data: result, message: 'Campaign not found' }
        }
      }

      let groups: Carry.Group[] = []

      let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
      const groupPaths = await Promise.all(
        Utils.queryInSnapCollections(
          firestore().collection(collections.ORGANISATIONS).doc(organisationId).collection(collections.GROUPS),
          'id',
          campaign.groupIds,
        ),
      )
      for (const snap of groupPaths) {
        groupDocRefs = groupDocRefs.concat(snap.docs)
      }
      groups = groupDocRefs.map((x) => x.data() as Carry.Group)

      const campaignModel = campaignServices.parseToModel(campaign)
      campaignModel.totalDonation = myDonation?.length > 0 ? _.sumBy(myDonation, 'amount') ?? 0 : 0
      if (campaign.campusIds?.length > 0) {
        const campusInfo = campuses?.filter((x) => campaign.campusIds.includes(x.id)) ?? []
        campaignModel.campuses = campusInfo.map((x) => {
          return {
            id: x.id,
            name: x.name,
            avatar: x.image,
          }
        })
      }
      if (campaign.groupIds?.length > 0) {
        const groupInfo = groups?.filter((x) => campaign.groupIds.includes(x.id)) ?? []
        campaignModel.groups = groupInfo.map((x) => {
          return {
            id: x.id,
            name: x.name ?? '',
            avatar: x.image,
            campusId: x.organisation?.campusId ?? '',
          }
        })
      }
      campaignModel.organization = {
        id: campaign.organizationId,
        name: organisation?.name ?? '',
      }
      result = campaignModel

      if (!flagMasterRole && isSameOrg) {
        const allowCampus = Utils.getCampus(userInfo.organisation)
        result.groups = _.filter(result.groups ?? [], (group) => {
          return allowCampus.includes(group.campusId)
        })
        result.campuses = _.filter(result.campuses ?? [], (campus) => {
          return allowCampus.includes(campus.id)
        })
      }

      const donors = await getDonations(organisationId, campaign.id)
      const dateInPast = sub(new Date(), { days: 30 })
      const donorInPast = donors.filter((x) => x.paidAt.toDate().getTime() < dateInPast.getTime())
      const donorInMonth = donors.filter((x) => x.paidAt.toDate().getTime() >= dateInPast.getTime())
      const totalDonor = _.compact(_.uniq(donors.map((x) => x.uid)))?.length ?? 0
      const totalDonorInPast = _.compact(_.uniq(donorInPast.map((x) => x.uid)))?.length ?? 0
      const totalDonorsIncrease = totalDonor - totalDonorInPast

      let totalDonateGrowth = 0
      if (donors.length > 0) {
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

export default func_get_campaign_details
