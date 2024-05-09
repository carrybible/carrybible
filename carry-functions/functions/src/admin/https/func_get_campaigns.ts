import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { Service, Utils } from '../../shared'
import { MASTER_ROLES } from '../../shared/Constants'
import { isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import campaignServices from '../services/campaignServices'
import campusServices from '../services/campusServices'
import organsationServices from '../services/organsationServices'

const func_get_campaigns = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      page?: number
      limit?: number
      status?: 'draft' | 'active' | 'ended'
      campusId?: string
      groupId?: string
      organisationId?: string
      sort?: {
        key: 'name' | 'end' | 'goal'
        order: 'asc' | 'desc'
      }
    },
    context,
  ) => {
    const uid = context.auth?.uid
    const page = payload.page ?? 1
    const limit = payload.limit ?? 999
    try {
      let result: Response.CampaignModel[] | undefined = []

      const authen = await isAuthen(uid, true)
      if (!authen.success) return authen

      // const userInfo: Carry.User = await getDataFromFirestore({ data: uid, type: 'user' })
      const userInfo: Carry.User = authen.user

      const organisationId = payload.organisationId || userInfo.organisation?.id
      if (!organisationId) {
        return {
          success: false,
          isAuthen: true,
          message: 'Permission Denied',
        }
      }

      const campaignsTask = campaignServices.getCampaigns(organisationId, payload?.campusId, payload?.groupId, payload?.status)
      const campusesTask = campusServices.getCampuses(organisationId)
      const organisationTask = organsationServices.getOrganisationInfo(organisationId)
      const [campaigns, campuses, organisation] = await Promise.all([campaignsTask, campusesTask, organisationTask])

      const total = campaigns.length
      let groups: Carry.Group[] = []
      let allCampusIds: string[] = []
      campaigns.forEach((x) => (allCampusIds = allCampusIds.concat(x.campusIds ?? [])))
      allCampusIds = _.compact(_.uniq(allCampusIds))

      if (allCampusIds?.length > 0) {
        let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
        const groupPaths = await Promise.all(
          Utils.queryInSnapCollections(
            firestore().collection(collections.GROUPS),
            'organisation.campusId',
            allCampusIds,
          ),
        )
        for (const snap of groupPaths) {
          groupDocRefs = groupDocRefs.concat(snap.docs)
        }
        groups = groupDocRefs.map((x) => x.data() as Carry.Group)
      }

      let campaignList = campaigns
      if (payload?.sort) {
        if (payload.sort.key === 'name') {
          campaignList = campaignList?.sort((n1, n2) => {
            const item1 = n1.name ?? ''
            const item2 = n2.name ?? ''
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
        if (payload.sort.key === 'end') {
          campaignList = campaignList?.sort((n1, n2) => {
            const timeNow = new Date().getTime()
            const item1: any = !n1.endDate ? Number.MAX_SAFE_INTEGER : n1.endDate.toMillis() - timeNow
            const item2: any = !n2.endDate ? Number.MAX_SAFE_INTEGER : n2.endDate.toMillis() - timeNow
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
        if (payload.sort.key === 'goal') {
          campaignList = campaignList?.sort((n1, n2) => {
            const item1 = n1.totalFunds
            const item2 = n2.totalFunds
            return (
              (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
              (payload.sort?.order === 'asc' ? 1 : payload.sort?.order === 'desc' ? -1 : 0)
            )
          })
        }
      } else {
        campaignList = campaignList?.sort((n1, n2) => {
          const timeNow = new Date().getTime()
          const item1 = !n1.created ? Number.MAX_SAFE_INTEGER : n1.created.toMillis() - timeNow
          const item2 = !n2.created ? Number.MAX_SAFE_INTEGER : n2.created.toMillis() - timeNow
          return (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * -1
        })
      }

      result = campaigns?.map((campaign) => {
        const campaignModel = campaignServices.parseToModel(campaign)
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
        return campaignModel
      })

      const flagMasterRole =
        payload.organisationId && payload.organisationId !== userInfo.organisation?.id // Don't apply for guest
          ? false
          : MASTER_ROLES.includes(userInfo.organisation?.role ?? '')

      if (!flagMasterRole) {
        const allowCampus = Utils.getCampus(
          payload.organisationId
            ? {
                id: payload.organisationId,
                campusId: payload.campusId,
                role: 'member',
              }
            : userInfo.organisation,
        )
        result = _.filter(result, (campaign) => {
          campaign.groups = _.filter(campaign.groups ?? [], (group) => {
            return allowCampus.includes(group.campusId)
          })
          campaign.campuses = _.filter(campaign.campuses ?? [], (campus) => {
            return allowCampus.includes(campus.id)
          })

          return campaign.campuses.length > 0
        })
      }
      if (payload?.search) {
        const searchText = payload?.search ?? ''
        result = _.filter(result, (item) => {
          return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
        })
      }
      result = _(result)
        .drop((page - 1) * limit)
        .take(limit)
        .value()
      return { success: true, page: payload.page, limit: payload.limit, total, data: result }
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

export default func_get_campaigns
