import { firestore } from 'firebase-admin'
import { logger } from 'firebase-functions/v1'
import _ from 'lodash'
import { Utils } from '../../shared'
import { DONATION_TYPE, FUNDSTATUS } from '../../shared/Constants'
import collections from '../../types/collections'
import campusServices from './campusServices'

export const getFunds = async (orgId?: string, campusId?: string, status?: string) => {
  let result: Carry.Fund[] = []

  if (!orgId) return result

  let fundQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.FUND)

  if (campusId) fundQuery = fundQuery.where('campusIds', 'array-contains', campusId)
  if (status) fundQuery = fundQuery.where('status', '==', status)

  const fundsRef = await fundQuery.get()
  result = fundsRef.docs.map((x) => x.data() as Carry.Fund)
  return result
}

export const getCampusOfFunds = async (orgId?: string) => {
  const result: Response.CampusWithTithing[] = []

  if (!orgId) return result

  const fundQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.FUND)

  const fundsRef = await fundQuery.get()

  for (const fundRef of fundsRef.docs) {
    const fundData = fundRef.data() as Carry.Fund
    if (fundData) {
      fundData.campusIds.forEach((campusId) => {
        result.push({
          id: campusId,
          fundId: fundData.id,
          fundName: fundData.name,
          image: '',
          name: '',
        })
      })
    }
  }
  return result
}

export const getFundDetail = async (fundId: string, orgId: string) => {
  let result: Carry.Fund | null = null

  if (!orgId || !fundId) return result

  const fundQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.FUND)
    .doc(fundId)

  const fundsRef = await fundQuery.get()
  result = fundsRef.data() as Carry.Fund
  return result
}

export const getDonorsOfFund = async (fundId: string, orgId: string, skip: number, take: number) => {
  let result: Carry.Donation[] = []

  if (!orgId || !fundId) return result

  const donationQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.DONATES)
    .where('type', '==', DONATION_TYPE.CAMPAIGN)
    .where('fundId', '==', fundId)
    .orderBy('timeDonation', 'desc')
    .startAfter(skip)
    .limit(take)

  const donationRef = await donationQuery.get()
  result = donationRef.docs.map((x) => x.data() as Carry.Donation)
  return result
}

export const changeFundStatus = async (
  fundId: string,
  orgId: string,
  status: 'active' | 'inactive',
  userInfo: Carry.User,
) => {
  if (!orgId || !fundId) return false

  try {
    //Check exist fund
    const existFundSnap = await firestore()
      .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
      .collection(collections.FUND)
      .doc(fundId)
      .get()

    if (!existFundSnap) {
      return {
        success: false,
        isAuthen: true,
        message: 'Not found Fund',
      }
    }

    const existFund = existFundSnap.data() as Carry.Fund

    if (existFund.status !== status) {
      const fundRef = firestore()
        .collection(collections.ORGANISATIONS)
        .doc(orgId)
        .collection(collections.FUND)
        .doc(fundId)

      await fundRef.set(
        {
          status: status,
          updateBy: userInfo.uid,
          updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        },
        { merge: true },
      )
    }
  } catch (error) {
    logger.error(error)
    throw error
  }
  return true
}

export const createFund = async (model: Request.FundRequestModel, userInfo: Carry.User) => {
  if (!model || !validateModel(model)) {
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

  const orgId = userInfo.organisation.id
  const campuses = await campusServices.getCampuses(orgId)

  let validCampus: boolean = true
  for (const campusId of model.campusIds) {
    if (!campuses?.find((x) => x.id === campusId)) {
      validCampus = false
      break
    }
  }

  if (!validCampus) throw new Error('Invalid Campus data')

  let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
  const groupPaths = await Promise.all(
    Utils.queryInSnapCollections(firestore().collection(collections.GROUPS), 'organisation.campusId', model.campusIds),
  )
  for (const snap of groupPaths) {
    groupDocRefs = groupDocRefs.concat(snap.docs)
  }

  const fundsSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .get()

  const funds = fundsSnap.docs.map((x) => x.data() as Carry.Fund)
  const fundUpdateTasks: Promise<any>[] = []
  for (const campusId of model.campusIds) {
    const fundUpdates = funds.filter((x) => x.campusIds.includes(campusId))
    if (fundUpdates?.length > 0) {
      for (const fundUpdate of fundUpdates) {
        const updateFundModel = {} as any
        updateFundModel.campusIds = fundUpdate.campusIds?.filter((x) => x !== campusId) ?? []
        const fundUpdateRef = firestore()
          .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
          .collection(collections.FUND)
          .doc(fundUpdate.id)
        fundUpdateTasks.push(fundUpdateRef.set({ ...updateFundModel }, { merge: true }))
      }
    }
  }

  let groupIds = groupDocRefs.map((x) => (x.data() as Carry.Group).id)

  groupIds = _.compact(_.uniq(groupIds))
  const newFundRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .doc()

  const fundData: Carry.Fund = {
    id: newFundRef.id,
    name: model.name,
    image: model.image,
    campusIds: model.campusIds,
    currency: model.currency,
    totalFunds: 0,
    description: model.description,
    organizationId: userInfo.organisation.id,
    suggestionAmounts: model.suggestions,
    donorIds: [],
    status: FUNDSTATUS.INACTIVE,
    created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    createBy: userInfo.uid,
    updateBy: userInfo.uid,
  }

  await newFundRef.set(fundData)

  const syncGroupTasks: Promise<any>[] = []
  groupIds.forEach((groupId) => {
    const groupRef = firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.GROUPS)
      .doc(groupId)
    const task = groupRef.set(
      {
        fundId: fundData.id,
      },
      { merge: true },
    )
    syncGroupTasks.push(task)
  })
  if (fundUpdateTasks.length > 0) {
    await Promise.all(fundUpdateTasks)
  }
  if (syncGroupTasks.length > 0) {
    await Promise.all(syncGroupTasks)
  }
  return {
    success: true,
    isAuthen: true,
    message: 'Add Fund success',
    data: fundData,
  }
}

export const updateFund = async (model: Request.FundUpdateRequestModel, userInfo: Carry.User) => {
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

  const orgId = userInfo.organisation.id
  const existFundSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .doc(model.id)
    .get()

  if (!existFundSnap) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Fund',
    }
  }

  const fundsSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .get()

  const funds = fundsSnap.docs.map((x) => x.data() as Carry.Fund)

  const fundUpdateTasks: Promise<any>[] = []

  const existFund = existFundSnap.data() as Carry.Fund
  const updateModel: any = {}
  const removeCampusInFund: string[] = []
  const addNewCampusInFund: string[] = []
  if (model.currency && model.currency !== existFund.currency) {
    updateModel.currency = model.currency
  }
  if (model.description !== undefined && model.description !== null && model.description !== existFund.description) {
    updateModel.description = model.description
  }
  if (model.name && model.name !== existFund.name) {
    updateModel.name = model.name
  }
  if (model.suggestions && model.suggestions.length > 0) {
    updateModel.suggestions = model.suggestions
  }
  if (model.image && model.image !== existFund.image) {
    updateModel.image = model.image
  }

  if (model.campusIds && model.campusIds?.length > 0) {
    let changeData = false
    for (const campusId of model.campusIds) {
      if (!existFund.campusIds.find((x) => x === campusId)) {
        changeData = true
        addNewCampusInFund.push(campusId)
        const fundUpdates = funds.filter((x) => x.campusIds.includes(campusId))
        if (fundUpdates?.length > 0) {
          for (const fundUpdate of fundUpdates) {
            const updateFundModel = {} as any
            updateFundModel.campusIds = fundUpdate.campusIds?.filter((x) => x !== campusId) ?? []
            const fundUpdateRef = firestore()
              .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
              .collection(collections.FUND)
              .doc(fundUpdate.id)
            fundUpdateTasks.push(fundUpdateRef.set({ ...updateFundModel }, { merge: true }))
          }
        }
      }
    }

    for (const campusId of existFund.campusIds) {
      if (!model.campusIds.find((x) => x === campusId)) {
        changeData = true
        removeCampusInFund.push(campusId)
      }
    }

    if (changeData) {
      const campuses = await campusServices.getCampuses(userInfo.organisation.id)

      let validCampus: boolean = true
      for (const campusId of model.campusIds) {
        if (!campuses?.find((x) => x.id === campusId)) {
          validCampus = false
          break
        }
      }

      if (!validCampus) throw new Error('Invalid Campus data')
      updateModel.campusIds = model.campusIds
    }
  }

  const fundRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .doc(model.id)

  await fundRef.set(
    {
      ...updateModel,
      updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      updateBy: userInfo.uid,
    },
    { merge: true },
  )

  //Replace fundId in each group
  if ((addNewCampusInFund.length > 0 || removeCampusInFund.length > 0) && model.campusIds) {
    if (fundUpdateTasks.length > 0) {
      await Promise.all(fundUpdateTasks)
    }
    const sumCampus = _.compact(_.uniq(model.campusIds.concat(existFund.campusIds)))

    let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
    const groupPaths = await Promise.all(
      Utils.queryInSnapCollections(firestore().collection(collections.GROUPS), 'organisation.campusId', sumCampus),
    )
    for (const snap of groupPaths) {
      groupDocRefs = groupDocRefs.concat(snap.docs)
    }

    const groupDatas = groupDocRefs.map((x) => x.data() as Carry.Group)

    const syncGroupTasks: Promise<any>[] = []
    addNewCampusInFund.forEach((campus) => {
      const groupsOfCampus = groupDatas.filter((x) => x.organisation?.campusId === campus)
      groupsOfCampus.forEach((group) => {
        if (group.id) {
          const groupRef = firestore()
            .collection(collections.ORGANISATIONS)
            .doc(orgId)
            .collection(collections.GROUPS)
            .doc(group.id)
          const task = groupRef.set(
            {
              fundId: existFund.id,
            },
            { merge: true },
          )
          syncGroupTasks.push(task)
        }
      })
    })

    removeCampusInFund.forEach((campus) => {
      const groupsOfCampus = groupDatas.filter((x) => x.organisation?.campusId === campus)
      groupsOfCampus.forEach((group) => {
        if (group.id) {
          const groupRef = firestore()
            .collection(collections.ORGANISATIONS)
            .doc(orgId)
            .collection(collections.GROUPS)
            .doc(group.id)
          const task = groupRef.update({
            fundId: firestore.FieldValue.delete(),
          })
          syncGroupTasks.push(task)
        }
      })
    })
    if (syncGroupTasks.length > 0) {
      await Promise.all(syncGroupTasks)
    }
  }
  return {
    success: true,
    isAuthen: true,
    message: 'Update Fund success',
  }
}

export const deleteFund = async (id: string, userInfo: Carry.User) => {
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

  const existFundSnap = await firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .doc(id)
    .get()

  if (!existFundSnap) {
    return {
      success: false,
      isAuthen: true,
      message: 'Not found Fund',
    }
  }

  const existFund = existFundSnap.data() as Carry.Fund

  if (existFund.status !== FUNDSTATUS.INACTIVE) {
    return {
      success: false,
      isAuthen: true,
      message: 'Cannot delete fund actived',
    }
  }

  if (existFund.totalFunds > 0) {
    return {
      success: false,
      isAuthen: true,
      message: 'Cannot delete fund have been donated',
    }
  }

  const fundRef = firestore()
    .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
    .collection(collections.FUND)
    .doc(id)

  await fundRef.delete()
  return {
    success: true,
    isAuthen: true,
    message: 'delete Fund success',
  }
}

export const parseToModel = (fund: Carry.Fund) => {
  if (!fund) return {} as Response.FundModel

  const fundModel: Response.FundModel = {
    id: fund.id,
    name: fund.name,
    image: fund.image,
    description: fund.description,
    suggestionAmounts: fund.suggestionAmounts,
    currency: fund.currency,
    organization: {
      id: fund.organizationId,
      name: '',
    },
    campuses: [],
    status: fund.status,
    totalFunds: fund.totalFunds,
    donorIds: fund.donorIds,
  }
  return fundModel
}

function validateModel(model: Request.FundRequestModel) {
  return !!(model.image && model.name && model.suggestions && model.currency && model.campusIds?.length > 0)
}

//Private Function
export default {
  getFundDetail,
  getFunds,
  getCampusOfFunds,
  changeFundStatus,
  parseToModel,
  createFund,
  updateFund,
  deleteFund,
}
