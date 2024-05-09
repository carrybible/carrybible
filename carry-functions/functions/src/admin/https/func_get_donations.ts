import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { MASTER_ROLES } from '../../shared/Constants'
import { Utils, Service } from '../../shared'
import collections from '../../types/collections'
import donationServices from '../services/donationServices'
import campaignServices from '../services/campaignServices'
import fundServices from '../services/fundServices'

const func_get_donations = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: Request.DonationRequestModel, context) => {
  const uid: string | undefined = context.auth?.uid
  try {
    const authen = await isAuthen(uid)
    if (!authen.success) return authen

    const userInfo: Carry.User = authen.user
    if (payload.limit < 0 || payload.page <= 0)
      return {
        success: false,
        isAuthen: true,
        message: 'Invalid data',
      }

    const flagMasterRole = MASTER_ROLES.includes(userInfo.organisation?.role ?? '')
    if (!flagMasterRole || !userInfo.organisation?.id)
      return {
        success: false,
        isAuthen: true,
        message: 'Permission Denied',
      }

    const donations = await donationServices.getDonations(
      userInfo.organisation.id,
      payload?.filters?.campaignId,
      payload?.filters?.fundId,
      payload?.filters?.campusId,
    )

    let result: (Response.DonationOfCampus | Response.DonationOfGroup | Response.DonationOfUser)[] = []
    if (payload?.scope === 'campus') {
      result = await getDataForScopeCampus(
        donations,
        userInfo.organisation.id,
        payload.filters?.campaignId,
        payload.filters?.fundId,
        payload.filters?.campusId,
        payload?.search,
        payload?.sort,
      )
    }
    if (payload?.scope === 'group') {
      result = await getDataForScopeGroup(
        donations,
        userInfo.organisation.id,
        payload.filters?.campaignId,
        payload.filters?.fundId,
        payload.filters?.campusId,
        payload?.search,
        payload?.sort,
      )
    }
    if (payload?.scope === 'user') {
      result = await getDataForScopeUser(donations, payload?.search, payload?.sort)
    }
    const total = result.length
    result = _(result)
      .drop((payload.page - 1) * payload.limit)
      .take(payload.limit)
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
})

const getDataForScopeUser = async (
  donations: Carry.Donation[],
  search?: string,
  sort?: {
    key: 'name' | 'amount' | 'date' | 'leader' | 'group'
    order: 'asc' | 'desc'
  },
) => {
  const userDatas: Carry.User[] = []
  const userIds = _.compact(_.uniq(donations.map((x) => x.uid)))

  const queryUserData = firestore().collection(collections.USERS)
  const userPartsSnap = await Promise.all(Utils.queryInSnapCollections(queryUserData, 'uid', userIds))

  if (userPartsSnap && userPartsSnap.length > 0) {
    userPartsSnap.forEach((userPart) => {
      if (userPart?.docs?.length > 0) {
        userPart.docs.forEach((item) => {
          const tmpUser = item.data() as Carry.User
          if (tmpUser) {
            userDatas.push(tmpUser)
          }
        })
      }
    })
  }

  let result: Response.DonationOfUser[] = []
  donations.forEach((donation) => {
    const userInfo = userDatas.find((x) => x.uid === donation.uid)
    result.push({
      amount: donation.amount,
      currency: donation.currency,
      id: userInfo?.uid ?? '',
      image: userInfo?.image ?? '',
      name: userInfo?.name ?? '',
      paidAt: donation.paidAt.toDate().toISOString(),
    })
  })

  if (sort) {
    if (sort.key === 'name') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.name ?? ''
        const item2 = n2.name ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'date') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.paidAt ?? ''
        const item2 = n2.paidAt ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'amount') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.amount
        const item2 = n2.amount
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
  }

  if (search) {
    const searchText = search ?? ''
    result = _.filter(result, (item) => {
      return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    })
  }
  return result
}

const getDataForScopeCampus = async (
  donations: Carry.Donation[],
  orgId: string,
  campaignId?: string,
  fundId?: string,
  campusId?: string,
  search?: string,
  sort?: {
    key: 'name' | 'amount' | 'date' | 'leader' | 'group'
    order: 'asc' | 'desc'
  },
) => {
  let campusDataQuery: firestore.CollectionReference<firestore.DocumentData> | firestore.Query<firestore.DocumentData> =
    await firestore().collection(collections.ORGANISATIONS).doc(orgId).collection(collections.CAMPUS)

  if (campusId) {
    campusDataQuery = campusDataQuery.where('id', '==', campusId)
  }
  const fundTask = fundServices.getFunds(orgId)
  const campaignTask = campaignServices.getCampaigns(orgId)
  const [campusDataSnap, funds, campaigns] = await Promise.all([campusDataQuery.get(), fundTask, campaignTask])

  const campusDatas = campusDataSnap.docs.map((x) => x.data() as Carry.Campus)

  let result: Response.DonationOfCampus[] = []
  let campusFilter = campusDatas
  if (campaignId) {
    const campaign = campaigns.find((x) => x.id === campaignId)
    campusFilter = campusDatas.filter((x) => campaign?.campusIds?.includes(x.id))
  }
  if (fundId) {
    const fund = funds.find((x) => x.id === fundId)
    campusFilter = campusDatas.filter((x) => fund?.campusIds?.includes(x.id))
  }
  if (campusId) {
    campusFilter = campusDatas.filter((x) => x.id === campaignId)
  }

  if ((campaignId || fundId) && campusFilter?.length > 0) {
    for (const campusInfo of campusFilter) {
      let currency = ''
      if (campaignId) {
        const campaign = campaigns.find((x) => x.id == campaignId)
        currency = campaign?.currency ?? ''
      }
      if (fundId) {
        const fund = funds.find((x) => x.id == fundId)
        currency = fund?.currency ?? ''
      }
      result.push({
        amount: 0,
        currency: currency,
        id: campusInfo.id ?? '',
        image: campusInfo.image ?? '',
        name: campusInfo.name ?? '',
        totalGroups: campusInfo.groupCount ?? 0,
      })
    }
  }

  for (const donation of donations) {
    const indexItem = _.findIndex(result, { id: donation.campusId })
    console.log(indexItem)
    if (indexItem >= 0 && result[indexItem]) {
      result[indexItem].amount = result[indexItem].amount + donation.amount
    } else {
      const campusInfo = campusDatas.find((x) => x.id === donation.campusId)
      result.push({
        amount: donation.amount,
        currency: donation.currency,
        id: campusInfo?.id ?? '',
        image: campusInfo?.image ?? '',
        name: campusInfo?.name ?? '',
        totalGroups: campusInfo?.groupCount ?? 0,
      })
    }
  }

  if (sort) {
    if (sort.key === 'name') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.name ?? ''
        const item2 = n2.name ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'group') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.totalGroups ?? ''
        const item2 = n2.totalGroups ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'amount') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.amount
        const item2 = n2.amount
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
  }

  if (search) {
    const searchText = search ?? ''
    result = _.filter(result, (item) => {
      return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    })
  }

  return result
}

const getDataForScopeGroup = async (
  donations: Carry.Donation[],
  orgId: string,
  campaignId?: string,
  fundId?: string,
  campusId?: string,
  search?: string,
  sort?: {
    key: 'name' | 'amount' | 'date' | 'leader' | 'group'
    order: 'asc' | 'desc'
  },
) => {
  const groupDataRef = firestore().collection(collections.ORGANISATIONS).doc(orgId).collection(collections.GROUPS).get()

  const fundTask = fundServices.getFunds(orgId, campusId)
  const campaignTask = campaignServices.getCampaigns(orgId, campusId)
  const [groupDataSnap, funds, campaigns] = await Promise.all([groupDataRef, fundTask, campaignTask])

  const groupDatas = groupDataSnap.docs.map((x) => x.data() as Carry.Group)

  const leaders: Carry.User[] = []
  let groupLeaders = groupDatas.map((x) => x.owner)
  groupLeaders = _.compact(_.uniq(groupLeaders))

  const queryUserData = firestore().collection(collections.USERS)
  const userPartsSnap = await Promise.all(Utils.queryInSnapCollections(queryUserData, 'uid', groupLeaders))
  if (userPartsSnap && userPartsSnap.length > 0) {
    userPartsSnap.forEach((userPart) => {
      if (userPart?.docs?.length > 0) {
        userPart.docs.forEach((item) => {
          const tmpUser = item.data() as Carry.User
          if (tmpUser) {
            leaders.push(tmpUser)
          }
        })
      }
    })
  }

  let result: Response.DonationOfGroup[] = []
  let groupFilter = groupDatas
  if (campaignId) {
    const campaign = campaigns.find((x) => x.id === campaignId)
    groupFilter = groupDatas.filter((x) => campaign?.groupIds?.includes(x.id))
  }
  if (fundId) {
    groupFilter = groupDatas.filter((x) => x.fundId === fundId)
  }
  if (campusId) {
    groupFilter = groupDatas.filter((x) => x.organisation?.campusId === campaignId)
  }

  if ((campaignId || fundId) && groupFilter?.length > 0) {
    for (const groupInfo of groupFilter) {
      let leaderInfo: Carry.User | undefined = undefined
      if (groupInfo?.owner) {
        leaderInfo = leaders.find((x) => x.uid === groupInfo.owner)
      }
      let currency = ''
      if (campaignId) {
        const campaign = campaigns.find((x) => x.id == campaignId)
        currency = campaign?.currency ?? ''
      }
      if (fundId) {
        const fund = funds.find((x) => x.id == fundId)
        currency = fund?.currency ?? ''
      }
      result.push({
        amount: 0,
        currency: currency,
        id: groupInfo.id ?? '',
        image: groupInfo.image ?? '',
        name: groupInfo.name ?? '',
        leader: {
          uid: leaderInfo?.uid ?? '',
          name: leaderInfo?.name ?? '',
        },
      })
    }
  }

  for (const donation of donations) {
    const indexItem = _.findIndex(result, { id: donation.groupId })
    if (indexItem >= 0 && result[indexItem]) {
      result[indexItem].amount = result[indexItem].amount + donation.amount
    } else {
      const groupInfo = groupDatas.find((x) => x.id === donation.groupId)

      let leaderInfo: Carry.User | undefined = undefined
      if (groupInfo?.owner) {
        leaderInfo = leaders.find((x) => x.uid === groupInfo.owner)
      }
      result.push({
        amount: donation.amount,
        currency: donation.currency,
        id: groupInfo?.id ?? '',
        image: groupInfo?.image ?? '',
        name: groupInfo?.name ?? '',
        leader: {
          uid: leaderInfo?.uid ?? '',
          name: leaderInfo?.name ?? '',
        },
      })
    }
  }

  if (sort) {
    if (sort.key === 'name') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.name ?? ''
        const item2 = n2.name ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'leader') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.leader?.name ?? ''
        const item2 = n2.leader?.name ?? ''
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
    if (sort.key === 'amount') {
      result = result?.sort((n1, n2) => {
        const item1 = n1.amount
        const item2 = n2.amount
        return (
          (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * (sort?.order === 'asc' ? 1 : sort?.order === 'desc' ? -1 : 0)
        )
      })
    }
  } else {
    result = result?.sort((n1, n2) => {
      const item1 = n1.amount
      const item2 = n2.amount
      return (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) * -1
    })
  }

  if (search) {
    const searchText = search ?? ''
    result = _.filter(result, (item) => {
      return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    })
  }
  return result
}
export default func_get_donations
