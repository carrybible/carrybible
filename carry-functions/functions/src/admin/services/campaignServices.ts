import { sub } from 'date-fns'
import { firestore } from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v1'
import _ from 'lodash'
import { Utils } from '../../shared'
import { CAMPAIGNSTATUS, DONATION_TYPE } from '../../shared/Constants'
import collections from '../../types/collections'
import campusServices from './campusServices'

export const getCampaigns = async (orgId?: string, campusId?: string, groupId?: string, status?: string) => {
  let result: Carry.Campaign[] = []

  if (!orgId) return result

  let campaignQueryWithCampus:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)

  if (campusId) campaignQueryWithCampus = campaignQueryWithCampus.where('campusIds', 'array-contains', campusId)
  if (status) campaignQueryWithCampus = campaignQueryWithCampus.where('status', '==', status)

  const campaignsCampusRef = await campaignQueryWithCampus.get()
  result = campaignsCampusRef.docs.map((x) => x.data() as Carry.Campaign)

  if (!groupId) {
    return result
  } else if (!campusId){
    result = []
  }

  let campaignQueryWithGroup:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)

  if (groupId) campaignQueryWithGroup = campaignQueryWithGroup.where('groupIds', 'array-contains', groupId)
  if (status) campaignQueryWithGroup = campaignQueryWithGroup.where('status', '==', status)

  const campaignsGroupRef = await campaignQueryWithGroup.get()
  const campaignGroups = campaignsGroupRef.docs.map((x) => x.data() as Carry.Campaign)

  if (campaignGroups?.length > 0) {
    for (const campaign of campaignGroups) {
      if (!result.find(x => x.id === campaign.id)) {
        result.push(campaign)
      }
    }
  }
  return result
}

export const getCampaignDetail = async (campaignId: string, orgId: string) => {
  let result: Carry.Campaign | null = null

  logger.info('GET CAMPSING DDF', campaignId, orgId)
  if (!orgId || !campaignId) return result

  const campaignQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)
      .doc(campaignId)

  const campaignsRef = await campaignQuery.get()
  result = campaignsRef.data() as Carry.Campaign
  return result
}

export const getDonorsOfCampaign = async (campaignId: string, orgId: string, skip: number, take: number) => {
  let result: Carry.Donation[] = []

  if (!orgId || !campaignId) return result

  const donationQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.DONATES)
      .where('type', '==', DONATION_TYPE.CAMPAIGN)
      .where('campaignId', '==', campaignId)
      .orderBy('timeDonation', 'desc')
      .startAfter(skip)
      .limit(take)

  const donationRef = await donationQuery.get()
  result = donationRef.docs.map((x) => x.data() as Carry.Donation)
  return result
}

export const publishCampaign = async (
  campaignId: string,
  orgId: string,
  campusIds: string[],
  startDate: FirebaseFirestore.Timestamp,
  endDate: FirebaseFirestore.Timestamp,
  userInfo: Carry.User,
) => {
  if (!orgId || !campaignId) return false

  try {
    //Check exist campaign
    const [campaign, campuses] = await Promise.all([
      getCampaignDetail(campaignId, orgId),
      campusServices.getCampuses(orgId),
    ])
    if (!campaign) return false

    if (startDate.toMillis() - startDate.toMillis() > 0) {
      return {
        success: false,
        isAuthen: true,
        message: 'End date cannot less than start date',
        data: undefined,
      }
    }

    if (campaign.status === CAMPAIGNSTATUS.ACTIVE) {
      return {
        success: false,
        isAuthen: true,
        message: 'Campaign Already Publish',
        data: undefined,
      }
    }

    let validCampus: boolean = true
    for (const campusId of campusIds) {
      if (!campuses?.find((x) => x.id === campusId)) {
        validCampus = false
        break
      }
    }

    if (!validCampus) {
      return {
        success: false,
        isAuthen: true,
        message: 'Invalid Campus data',
        data: undefined,
      }
    }

    const campusAssign = _.compact(_.uniq(campusIds))
    let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
    const groupPaths = await Promise.all(
      Utils.queryInSnapCollections(firestore().collection(collections.GROUPS), 'organisation.campusId', campusAssign),
    )
    for (const snap of groupPaths) {
      groupDocRefs = groupDocRefs.concat(snap.docs)
    }

    let groupIds = groupDocRefs.map((x) => (x.data() as Carry.Group).id)
    const groupDatas = groupDocRefs.map((x) => x.data() as Carry.Group)

    groupDatas.forEach((group) => {
      if (group.campaignIds && group.campaignIds?.length > 0) {
        if (!group.campaignIds?.includes(campaignId)) {
          group.campaignIds.push(campaignId)
        }
      } else {
        group.campaignIds = [campaignId]
      }
    })

    const campaignRef = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)
      .doc(campaignId)

    groupIds = _.compact(_.uniq(groupIds))

    await campaignRef.set(
      {
        startDate: startDate,
        endDate: endDate,
        status: CAMPAIGNSTATUS.ACTIVE,
        campusIds: campusAssign ?? [],
        groupIds: groupIds?.length > 0 ? groupIds : [],
        updateBy: userInfo.uid,
        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      },
      { merge: true },
    )

    const syncGroupTasks: Promise<any>[] = []
    groupDatas.forEach((group) => {
      if (group.id) {
        const groupRef = firestore()
          .collection(collections.ORGANISATIONS)
          .doc(orgId)
          .collection(collections.GROUPS)
          .doc(group.id)
        const task = groupRef.set(
          {
            campaignIds: group.campaignIds,
          },
          { merge: true },
        )
        syncGroupTasks.push(task)
      }
    })
    if (syncGroupTasks.length > 0) {
      await Promise.all(syncGroupTasks)
    }
  } catch (error) {
    logger.error(error)
    throw error
  }
  return {
    success: true,
    isAuthen: true,
    message: 'Publish campaign success',
  }
}

export const publishCampaignWithGroups = async (
  campaignId: string,
  orgId: string,
  groupIds: string[],
  startDate: FirebaseFirestore.Timestamp,
  endDate: FirebaseFirestore.Timestamp,
  userInfo: Carry.User,
) => {
  if (!orgId || !campaignId) return false

  try {
    //Check exist campaign
    const campaign = await getCampaignDetail(campaignId, orgId);
    if (!campaign) return false
    let groupDocRefs: firestore.QueryDocumentSnapshot[] = []

    const groupPaths = await Promise.all(
      Utils.queryInSnapCollections(firestore().collection(collections.GROUPS).where('organisation.id', "==", orgId), 'id', groupIds),
    )
    for (const snap of groupPaths) {
      groupDocRefs = groupDocRefs.concat(snap.docs)
    }
    const groupDatas = groupDocRefs.map((x) => x.data() as Carry.Group)
    if (startDate.toMillis() - startDate.toMillis() > 0) {
      return {
        success: false,
        isAuthen: true,
        message: 'End date cannot less than start date',
        data: undefined,
      }
    }

    if (campaign.status === CAMPAIGNSTATUS.ACTIVE) {
      return {
        success: false,
        isAuthen: true,
        message: 'Campaign Already Publish',
        data: undefined,
      }
    }

    groupDatas.forEach((group) => {
      if (group.campaignIds && group.campaignIds?.length > 0) {
        if (!group.campaignIds?.includes(campaignId)) {
          group.campaignIds.push(campaignId)
        }
      } else {
        group.campaignIds = [campaignId]
      }
    })

    const campaignRef = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)
      .doc(campaignId)

    const groupIdUniques = _.compact(_.uniq(groupIds))

    await campaignRef.set(
      {
        startDate: startDate,
        endDate: endDate,
        status: CAMPAIGNSTATUS.ACTIVE,
        groupIds: groupIdUniques?.length > 0 ? groupIdUniques : [],
        updateBy: userInfo.uid,
        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      },
      { merge: true },
    )

    const syncGroupTasks: Promise<any>[] = []
    groupDatas.forEach((group) => {
      if (group.id) {
        const groupRef = firestore()
          .collection(collections.ORGANISATIONS)
          .doc(orgId)
          .collection(collections.GROUPS)
          .doc(group.id)
        const task = groupRef.set(
          {
            campaignIds: group.campaignIds,
          },
          { merge: true },
        )
        syncGroupTasks.push(task)
      }
    })
    if (syncGroupTasks.length > 0) {
      await Promise.all(syncGroupTasks)
    }
  } catch (error) {
    logger.error(error)
    throw error
  }
  return {
    success: true,
    isAuthen: true,
    message: 'Publish campaign success',
  }
}

export const uploadVideoCampaign = async (
  campaignId: string,
  orgId: string,
  videoModel: Request.CampainVideoRequestModel,
  userInfo: Carry.User,
) => {
  if (!orgId || !campaignId) return false

  try {
    //Check exist campaign
    const campaign = await getCampaignDetail(campaignId, orgId)
    if (!campaign) return false

    if (!videoModel || !videoModel.title || !videoModel.url || !videoModel.videoOption) {
      throw new Error('Invalid data input')
    }

    const campainRef = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.CAMPAIGN)
      .doc(campaignId)

    await campainRef.set(
      {
        video: videoModel,
        updateBy: userInfo.uid,
        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      },
      { merge: true },
    )
  } catch (error) {
    logger.error(error)
    throw error
  }
  return true
}

export const createCampaign = async (model: Request.CampaignRequestModel, userInfo: Carry.User) => {
  if (!model || !validateModel(model)) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid model input',
      data: undefined,
    }
  }

  if (!userInfo.organisation?.id)
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }

  const newCampaignRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc()

  const campaignData: Carry.Campaign = {
    id: newCampaignRef.id,
    name: model.name,
    image: model.image,
    campusIds: [],
    groupIds: [],
    currency: model.currency,
    totalFunds: 0,
    description: model.description,
    goalAmount: model.goal,
    organizationId: userInfo.organisation.id,
    suggestionAmounts: model.suggestions,
    donorIds: [],
    status: CAMPAIGNSTATUS.DRAFT,
    created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    createBy: userInfo.uid,
    updateBy: userInfo.uid,
  }

  await newCampaignRef.set(campaignData)
  return {
    success: true,
    isAuthen: true,
    message: 'Add Campaign success',
    data: campaignData,
  }
}

export const updateCampaign = async (model: Request.CampaignUpdateRequestModel, userInfo: Carry.User) => {
  if (!model || !model.id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid model input',
      data: undefined,
    }
  }

  if (!userInfo.organisation?.id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }
  }

  const existCampaignSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc(model.id)
    .get()

  if (!existCampaignSnap) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Campaign',
    }
  }

  const existCampaign = existCampaignSnap.data() as Carry.Campaign
  const updateModel: any = {}
  if (model.goal && model.goal >= 0) {
    updateModel.goalAmount = model.goal
  }
  if (model.currency && model.currency !== existCampaign.currency) {
    updateModel.currency = model.currency
  }
  if (
    model.description !== undefined &&
    model.description !== null &&
    model.description !== existCampaign.description &&
    existCampaign.status === CAMPAIGNSTATUS.DRAFT
  ) {
    updateModel.description = model.description
  }
  if (model.name && model.name !== existCampaign.name && existCampaign.status === CAMPAIGNSTATUS.DRAFT) {
    updateModel.name = model.name
  }
  if (model.suggestions && model.suggestions.length > 0 && existCampaign.status === CAMPAIGNSTATUS.DRAFT) {
    updateModel.suggestionAmounts = model.suggestions
  }
  if (model.image && model.image !== existCampaign.image && existCampaign.status === CAMPAIGNSTATUS.DRAFT) {
    updateModel.image = model.image
  }
  if (model.endDate && existCampaign.status === CAMPAIGNSTATUS.ACTIVE) {
    updateModel.endDate = Timestamp.fromDate(new Date(model.endDate))
  }

  const campaignRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc(model.id)

  await campaignRef.set(
    {
      ...updateModel,
      updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      updateBy: userInfo.uid,
    },
    { merge: true },
  )
  return {
    success: true,
    isAuthen: true,
    message: 'Update Campaign success',
  }
}

export const deleteCampaign = async (id: string, userInfo: Carry.User) => {
  if (!id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid input',
      data: undefined,
    }
  }

  if (!userInfo.organisation?.id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }
  }

  const existCampaignSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc(id)
    .get()

  if (!existCampaignSnap) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Campaign',
    }
  }

  const existCampaign = existCampaignSnap.data() as Carry.Campaign

  if (existCampaign.status !== CAMPAIGNSTATUS.DRAFT) {
    return {
      success: false,
      isAuthen: true,
      message: 'Cannot delete campaign published',
    }
  }

  if (existCampaign.totalFunds > 0) {
    return {
      success: false,
      isAuthen: true,
      message: 'Cannot delete campaign have been donated',
    }
  }

  const campaignRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc(id)

  await campaignRef.delete()
  return {
    success: true,
    isAuthen: true,
    message: 'delete Campaign success',
  }
}

export const removeVideoAttach = async (id: string, userInfo: Carry.User) => {
  if (!id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Invalid model input',
      data: undefined,
    }
  }

  if (!userInfo.organisation?.id) {
    return {
      success: false,
      isAuthen: true,
      message: 'Permission Denied',
      data: undefined,
    }
  }

  const existCampaignSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.CAMPAIGN)
    .doc(id)
    .get()

  if (!existCampaignSnap) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Campaign',
    }
  }

  const existCampaign = existCampaignSnap.data() as Carry.Campaign

  if (existCampaign?.video) {
    const updateModel: any = {
      video: firestore.FieldValue.delete(),
    }

    const campaignRef = firestore()
      .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
      .collection(collections.CAMPAIGN)
      .doc(id)

    await campaignRef.update({
      ...updateModel,
      updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      updateBy: userInfo.uid,
    })
  }

  return {
    success: true,
    isAuthen: true,
    message: 'Update Campaign success',
  }
}

export const parseToModel = (campaign: Carry.Campaign) => {
  if (!campaign) return {} as Response.CampaignModel

  const campaignModel: Response.CampaignModel = {
    id: campaign.id,
    name: campaign.name,
    image: campaign.image,
    description: campaign.description,
    goalAmount: campaign.goalAmount,
    suggestionAmounts: campaign.suggestionAmounts,
    currency: campaign.currency,
    status: campaign.status,
    organization: {
      id: campaign.organizationId,
      name: '',
    },
    campuses: [],
    groups: [],
    startDate: campaign.startDate?.toDate()?.toISOString(),
    endDate: campaign.endDate?.toDate()?.toISOString(),
    totalFunds: campaign.totalFunds,
    donorIds: campaign.donorIds,
  }
  if (campaign.video) {
    campaignModel.video = campaign.video
  }
  return campaignModel
}

export const getGivingReport = async (orgId?: string) => {
  const result: Response.ReportGiving[] = [] as Response.ReportGiving[]

  if (!orgId) return result

  const campaignRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.CAMPAIGN)
    .get()

  const fundRef = firestore().collection(collections.ORGANISATIONS).doc(orgId).collection(collections.FUND).get()

  const donorsRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.DONATES)
    .where('paidAt', '>=', firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
    .get()

  const donorsInPastRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.DONATES)
    .where('paidAt', '<', firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
    .get()

  const [campaignsSnap, fundsSnap, donorsSnap, donorsInPastSnap] = await Promise.all([
    campaignRef,
    fundRef,
    donorsRef,
    donorsInPastRef,
  ])

  const campaigns = campaignsSnap?.docs?.map((x) => x.data() as Carry.Campaign)
  const funds = fundsSnap?.docs?.map((x) => x.data() as Carry.Fund)
  const donors = donorsSnap?.docs?.map((x) => x.data() as Carry.Donation)
  const donorInPast = donorsInPastSnap?.docs?.map((x) => x.data() as Carry.Donation)

  const campaignGroups = _.groupBy(campaigns, 'currency')
  const fundGroup = _.groupBy(funds, 'currency')

  let currencies = campaigns.map((x) => x.currency)
  currencies = currencies.concat(funds.map((x) => x.currency))
  currencies = _.compact(_.uniq(currencies))

  for (const currency of currencies) {
    const resultItem: Response.ReportGiving = {} as Response.ReportGiving
    resultItem.currency = currency
    resultItem.totalFunds = 0
    resultItem.totalDonors = 0

    const currencyCampaigns = campaignGroups[currency] ?? []
    const currencyFunds = fundGroup[currency] ?? []
    const campaignIds = _.compact(_.uniq(currencyCampaigns.map((x) => x.id)))
    const fundIds = _.compact(_.uniq(currencyFunds.map((x) => x.id)))
    const currencyDonors = donors.filter(
      (x) => campaignIds.includes(x.campaignId ?? '') || fundIds.includes(x.fundId ?? ''),
    )
    const currencyDonorInPast = donorInPast.filter(
      (x) => campaignIds.includes(x.campaignId ?? '') || fundIds.includes(x.fundId ?? ''),
    )

    let donorIds: string[] = []
    const donorPastIds: string[] = _.compact(_.uniq(currencyDonorInPast.map((x) => x.uid)))
    if (currencyCampaigns?.length > 0) {
      resultItem.totalFunds += _.sumBy(currencyCampaigns, 'totalFunds')
      currencyCampaigns.forEach((campaign) => {
        if (campaign.campusIds?.length > 0) {
          donorIds = donorIds.concat(campaign.donorIds)
        }
      })
    }

    if (currencyFunds?.length > 0) {
      resultItem.totalFunds += _.sumBy(currencyFunds, 'totalFunds')
      currencyFunds.forEach((fund) => {
        if (fund.campusIds?.length > 0) {
          donorIds = donorIds.concat(fund.donorIds)
        }
      })
    }

    const donorsGrowth = donorIds.length - donorPastIds.length
    let totalDonateGrowth = 0
    if (currencyDonors?.length > 0) {
      totalDonateGrowth = _.sumBy(currencyDonors, 'amount')
    }
    const totalFundInPast = resultItem.totalFunds - totalDonateGrowth
    resultItem.totalDonors = donorIds.length

    resultItem.totalDonorsIncrease = donorsGrowth
    resultItem.totalFundsIncreasedPercent =
      totalFundInPast === 0
        ? resultItem.totalFunds > 0
          ? 100
          : 0
        : Math.round((totalDonateGrowth / totalFundInPast) * 100)
    donorIds = _.compact(_.uniq(donorIds))
    resultItem.totalFundsOvertime = getGrowthDonorInMonth(currencyDonors, donorPastIds)
    result.push(resultItem)
  }

  return result
}

function getGrowthDonorInMonth(donorInMonth: Carry.Donation[], donorPastIds: string[]) {
  const tmpListDate: { date: any }[] = []

  const today = new Date(new Date().toISOString().slice(0, 10))
  const max = today
  const min = new Date(new Date().toISOString().slice(0, 10))
  min.setDate(max.getDate() - 30)

  for (const d = min; d <= max; d.setDate(d.getDate() + 1)) {
    const element = new Date(d).toISOString().slice(0, 10)
    tmpListDate.push({ date: element })
  }

  //init return object
  const groupDates = _(tmpListDate)
    .groupBy((x) => x.date)
    .value()
  Object.keys(groupDates).forEach(function (index) {
    groupDates[index] = []
  })

  donorInMonth.forEach((element) => {
    if (!groupDates[new Date(element.paidAt.toDate()).toISOString().slice(0, 10)]) {
      groupDates[new Date(element.paidAt.toDate()).toISOString().slice(0, 10)] = []
      groupDates[new Date(element.paidAt.toDate()).toISOString().slice(0, 10)].push(element as any)
    } else {
      groupDates[new Date(element.paidAt.toDate()).toISOString().slice(0, 10)].push(element as any)
    }
  })

  let currentUserId: string[] = donorPastIds

  const growths = _(groupDates)
    .mapValues((x) => {
      currentUserId = currentUserId.concat(x.map((q: any) => q.uid as string))
      currentUserId = _.compact(_.uniq(currentUserId))
      return currentUserId?.length ?? 0
    })
    .value()
  return growths
}

function validateModel(model: Request.CampaignRequestModel) {
  return !!(model.image && model.name && model.goal && model.suggestions && model.currency)
}
//Private Function
export default {
  getCampaignDetail,
  getCampaigns,
  publishCampaign,
  publishCampaignWithGroups,
  uploadVideoCampaign,
  parseToModel,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  removeVideoAttach,
  getGivingReport,
}
