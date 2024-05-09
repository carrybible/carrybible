import { sub } from 'date-fns'
import * as admin from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { Service, Utils } from '../../shared'
import { SCOPE } from '../../shared/Constants'
import { getDataFromFirestore, isAuthen } from '../../shared/Permission'
import { getInitRecord, getInitRecordForUser } from '../../shared/ScoreUtils'
import collections from '../../types/collections'

const func_get_reports = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
  timeoutSeconds: 120,
  memory: '512MB',
}).https.onCall(
  async (
    payload: {
      scopeId?: string
      scope: string
    },
    context,
  ) => {
    let result: Partial<Response.Result> = {}
    const { scopeId } = payload
    const scope = payload?.scope || SCOPE.DASHBOARD
    const authentication = (await isAuthen(context.auth?.uid)) as {
      success: boolean
      isAuthen?: boolean
      message?: string
      permissions?: string[]
      user: Carry.User
    }

    logger.info('[Request report]', payload)

    if (authentication.success && authentication.user?.organisation) {
      if (scope !== SCOPE.DASHBOARD && !scopeId)
        return {
          success: false,
          message: 'Missing id!',
        }
      try {
        switch (scope) {
          case SCOPE.ORGANISATION:
            if (['owner', 'admin'].includes(authentication.user.organisation.role)) {
              result = await getDataDashboardForOrg(scopeId || '')
              return { success: true, data: result }
            } else {
              return {
                success: false,
                isAuthen: false,
                message: 'Have no permission to access',
              }
            }
          case SCOPE.CAMPUS:
            if (['owner', 'admin', 'campus-leader', 'campus-user'].includes(authentication.user.organisation.role)) {
              result = await getDataDashboardForCampus(
                Utils.getCampus(authentication.user.organisation) || [scopeId],
                authentication.user.organisation.id,
              )
              return { success: true, data: result }
            } else {
              return {
                success: false,
                isAuthen: false,
                message: 'Have no permission to access',
              }
            }
          case SCOPE.GROUP:
            if (['owner', 'admin', 'campus-leader', 'campus-user'].includes(authentication.user.organisation.role)) {
              result = await getDataReportForGroup(scopeId || '', authentication.user.organisation.id)
              return { success: true, data: result }
            } else {
              return {
                success: false,
                isAuthen: false,
                message: 'Have no permission to access',
              }
            }
          case SCOPE.USER:
            const userData =
              context.auth?.uid === scopeId
                ? authentication.user
                : await getDataFromFirestore({ type: 'user', data: scopeId })
            result = (await getDataDashboardForUser(userData)) || {}
            return { success: true, data: { ...result, dailyStreak: userData.currentStreak || 0 } }

          // Scope auto
          case SCOPE.DASHBOARD:
            if (['owner', 'admin'].includes(authentication.user.organisation.role)) {
              result = await getDataDashboardForOrg(authentication.user.organisation?.id)
              return { success: true, data: result }
            }
            if (['campus-leader', 'campus-user'].includes(authentication.user.organisation.role)) {
              result = await getDataDashboardForCampus(
                Utils.getCampus(authentication.user.organisation) || [scopeId],
                authentication.user.organisation.id,
              )
              return { success: true, data: result }
            }
            break
          default:
            break
        }
      } catch (error: any) {
        return { success: false, isAuthen: true, message: error?.message }
      }
    }
    return { success: false, isAuthen: false }
  },
)

function getGrowthUserInMonth(users: Carry.User[], totalUser: number) {
  const tmpListDate: { date: string }[] = []

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

  users.forEach((element) => {
    if (!groupDates[new Date((element.joined?.seconds || 0) * 1000).toISOString().slice(0, 10)]) {
      groupDates[new Date((element.joined?.seconds || 0) * 1000).toISOString().slice(0, 10)] = []
      groupDates[new Date((element.joined?.seconds || 0) * 1000).toISOString().slice(0, 10)].push(element as any)
    } else {
      groupDates[new Date((element.joined?.seconds || 0) * 1000).toISOString().slice(0, 10)].push(element as any)
    }
  })

  let total = totalUser - users.length

  const growths = _(groupDates)
    .mapValues((x) => {
      total += x.length
      return total
    })
    .value()

  return growths
}

async function getDataDashboardForOrg(orgId: string) {
  const orgRef = admin.firestore().collection('organisations').doc(orgId)
  const [orgDoc, usersGrowth, groupsGrowth] = await Promise.all([
    orgRef.get(),
    orgRef
      .collection('members')
      .where('joined', '>=', admin.firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
      .get(),
    orgRef
      .collection('groups')
      .where('created', '>=', admin.firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
      .get(),
    await orgRef.collection('groups').get(),
  ])
  let orgData = (orgDoc.data() || {}) as Carry.Organisation
  const newMembers: Carry.User[] = usersGrowth.docs.map((doc) => doc.data() as Carry.User)
  const memberGrowth = await getGrowthUserInMonth(newMembers, orgData.memberCount || 0)

  if (!orgData.recentPraise && !orgData.recentPrayer && !orgData.recentMessage && !orgData.recentReading) {
    // Get init value for temporary
    orgData = { ...orgData, ...getInitRecord('', orgData) }
  }

  return {
    increaseUserPercent: getPercent(usersGrowth.docs.length, orgData.memberCount),
    memberGrowth: memberGrowth,
    increaseGroup: groupsGrowth.docs.length,
    totalMember: orgData.memberCount || 0,
    totalGroup: orgData.groupCount || 0,
    totalPrayer: orgData.totalPrayer || 0,
    totalGratitude: orgData.totalPraise || 0,
    totalMessage: orgData.totalMessage || 0,
    totalMinute: Math.round((orgData.totalReadingTime || 0) / 60000),
    prayerUsers: orgData.recentPrayer || [],
    gratitudeUsers: orgData.recentPraise || [],
    messageUsers: orgData.recentMessage || [],
    readingUsers: orgData.recentReading || [],
  }
}

async function getDataReportForGroup(groupId: string, orgId: string) {
  const ref = admin
    .firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.GROUPS)
    .doc(groupId)
  let groupData = (await ref.get()).data() as Carry.Group
  const baseGroup = (await admin.firestore().collection(collections.GROUPS).doc(groupId).get()).data() as Carry.Group

  if (!groupData.recentPraise && !groupData.recentPrayer && !groupData.recentMessage && !groupData.recentReading) {
    // Get init value for temporary
    groupData = { ...groupData, ...getInitRecord('', groupData) }
  }

  return {
    totalMember: baseGroup.memberCount || 0,
    totalPrayer: Math.max(groupData.totalPrayer || 0, baseGroup.totalPrayer || 0),
    totalGratitude: Math.max(groupData.totalPraise || 0, baseGroup.totalPraise || 0),
    totalMessage: Math.max(groupData.totalMessage || 0, baseGroup.activityToday?.messageSent || 0),
  }
}

// TO-DO: Need to be update logic
async function getDataDashboardForCampus(campusIds: string[], orgId: string) {
  const orgRef = admin.firestore().collection('organisations').doc(orgId)
  const campusRefs: { campusId: string; Ref: admin.firestore.DocumentReference }[] = []
  const campusDos: Promise<admin.firestore.DocumentSnapshot>[] = []
  const usersGrowths: Promise<admin.firestore.QuerySnapshot>[] = []
  const groupsGrowths: Promise<admin.firestore.QuerySnapshot>[] = []
  const groupsOfCampus: Promise<admin.firestore.QuerySnapshot>[] = []
  for (const campusId of campusIds) {
    const campusRef = admin.firestore().collection('organisations').doc(orgId).collection('campuses').doc(campusId)
    campusRefs.push({
      campusId: campusId,
      Ref: campusRef,
    })
    const [campusDoc, usersGrowth, groupsGrowth, groupOfCampus] = [
      campusRef.get(),
      orgRef
        .collection('members')
        .where('joined', '>=', admin.firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
        .where('organisation.campusId', '==', campusId)
        .get(),
      orgRef
        .collection('groups')
        .where('created', '>=', admin.firestore.Timestamp.fromDate(sub(new Date(), { days: 30 })))
        .where('organisation.campusId', '==', campusId)
        .get(),
      admin
        .firestore()
        .collection('organisations')
        .doc(orgId)
        .collection('groups')
        .where('organisation.campusId', '==', campusId)
        .get(),
      orgRef.collection('groups').where('organisation.campusId', '==', campusId).get(),
    ]
    campusDos.push(campusDoc)
    usersGrowths.push(usersGrowth)
    groupsGrowths.push(groupsGrowth)
    groupsOfCampus.push(groupOfCampus)
  }

  const campusDataPro = Promise.all(campusDos)
  const usersGrowthDataPro = Promise.all(usersGrowths)
  const groupsGrowthDataPro = Promise.all(groupsGrowths)
  const groupsOfCampusPro = Promise.all(groupsOfCampus)

  const [campusSnaps, usersGrowthSnaps, groupsGrowthSnaps, groupsOfCampusSnap] = await Promise.all([
    campusDataPro,
    usersGrowthDataPro,
    groupsGrowthDataPro,
    groupsOfCampusPro,
  ])

  const campusDatas: Carry.Campus[] = []
  let newMembers: Carry.User[] = []
  let groupsGrowthDatas: Carry.Group[] = []
  let groupsOfCampusDatas: Carry.Group[] = []

  for (const campus of campusSnaps) {
    campusDatas.push(campus.data() as Carry.Campus)
  }

  for (const campus of campusDatas) {
    if (!campus.memberCount && campus.id) {
      const campusRef = admin
        .firestore()
        .collection(collections.ORGANISATIONS)
        .doc(orgId)
        .collection(collections.CAMPUS)
        .doc(campus.id)
      const campusUsers = (
        await admin.firestore().collection(collections.USERS).where('organisation.campusId', '==', campus.id).get()
      ).docs.map((x) => x.data() as Carry.User)
      const userOfCampus = _.compact(_.uniq(campusUsers?.map((x) => x.uid) ?? []))
      await campusRef.set(
        {
          members: userOfCampus ?? [],
          memberCount: userOfCampus?.length ?? 0,
        },
        {
          merge: true,
        },
      )
      campus.memberCount = userOfCampus?.length ?? 0
      campus.members = userOfCampus ?? []
    }
  }

  for (const usersGrowth of usersGrowthSnaps) {
    newMembers = newMembers.concat(usersGrowth.docs.map((userDoc) => userDoc.data() as Carry.User))
  }

  for (const groupsGrowth of groupsGrowthSnaps) {
    groupsGrowthDatas = groupsGrowthDatas.concat(groupsGrowth.docs.map((groupDoc) => groupDoc.data() as Carry.Group))
  }

  for (const groupData of groupsOfCampusSnap) {
    groupsOfCampusDatas = groupsOfCampusDatas.concat(groupData.docs.map((groupDoc) => groupDoc.data() as Carry.Group))
  }

  const result = {
    increaseUserPercent: getPercent(
      _.uniq(newMembers.map((x) => x.uid)).length,
      _.sum(campusDatas.map((x) => x.memberCount ?? 0)),
    ),
    memberGrowth: {} as any,
    increaseGroup: groupsGrowthDatas.length,
    totalMember: _.sum(campusDatas.map((x) => x.memberCount ?? 0)) || 0,
    totalGroup: _.sum(campusDatas.map((x) => x.groupCount ?? 0)) || 0,
    totalPrayer: _.sum(campusDatas.map((x) => x.totalPrayer ?? 0)) || 0,
    totalGratitude: _.sum(campusDatas.map((x) => x.totalPraise ?? 0)) || 0,
    totalMessage: 0,
    totalMinute: Math.round((_.sum(campusDatas.map((x) => x.totalReadingTime ?? 0)) || 0) / 60000),
    prayerUsers: [] as any,
    gratitudeUsers: [] as any,
    messageUsers: [] as any,
  }

  for (const campusData of campusDatas) {
    const memberGrowth = await getGrowthUserInMonth(newMembers, campusData.memberCount || 0)
    if (memberGrowth) {
      Object.keys(memberGrowth).forEach((key) => {
        if (!result.memberGrowth[key]) {
          result.memberGrowth[key] = memberGrowth[key]
        } else {
          result.memberGrowth[key] += memberGrowth[key]
        }
      })
    }
    let campus = { ...campusData }
    if (
      !campusData.recentPraise &&
      !campusData.recentPrayer &&
      !campusData.recentMessage &&
      !campusData.recentReading
    ) {
      // Get init value for temporary
      campus = { ...campusData, ...getInitRecord('', campusData) }
    }
    if (campus.recentMessage) {
      result.messageUsers.concat(campus.recentMessage)
    }
    if (campus.recentPrayer) {
      result.prayerUsers.concat(campus.recentPrayer)
    }
    if (campus.recentPraise) {
      result.gratitudeUsers.concat(campus.recentPraise)
    }
    result.totalMessage += campus.totalMessage || 0
  }

  return result
}

async function getDataDashboardForUser(userInfo: Carry.User) {
  const userRef = admin
    .firestore()
    .collection('organisations')
    .doc(userInfo.organisation?.id || '')
    .collection('members')
    .doc(userInfo.uid)
  const userDoc = await userRef.get()
  let userData = userDoc.data() as Carry.User

  if (!userData.totalPrayer && !userData.totalPraise && !userData.totalReadingTime) {
    userData = { ...userData, ...(await getInitRecordForUser('', userInfo, userData)) }
  }

  return {
    totalPrayer: userData.totalPrayer,
    totalGratitude: userData.totalPraise,
    totalMessage: userData.totalMessage,
  }
}

const getPercent = (newCount: any, total: any) => {
  const n = Number(newCount)
  const t = Number(total)
  if (!n || !t || n >= t - n) return n ? n * 100 : 0
  return Number(((n / (t - n)) * 100).toFixed(0))
}

export default func_get_reports
