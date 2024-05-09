import { add, format } from 'date-fns'
import { firestore as firestoreAdmin } from 'firebase-admin'
import { GroupPlan } from '../types/studyPlan'
import { Service, Utils } from './index'

import { logger } from 'firebase-functions/v1'
import { EVENTS } from '../cronjobs/tasks/types'
import Worker from '../cronjobs/tasks/workers'
import collections from '../types/collections'
import {
  DEFAULT_SCORE,
  GroupScoreSettingType,
  MAX_SCORE,
  MIN_SCORE,
  SCORE_DAILY_CONFIG,
  Score,
  ScoreDailyActionType,
  ScoreDailyLog,
} from '../types/score'
import { REMIND_DAILY_CONFIG } from './Constants'
import { genTran } from './i18n'

const db = Service.Firebase.firestore()

let GroupScoreSettingCache: GroupScoreSettingType | null = null
async function getGroupScoreSetting(): Promise<GroupScoreSettingType> {
  if (GroupScoreSettingCache) {
    return GroupScoreSettingCache
  }
  const groupScoreSettingSnap = await db.collection('settings').doc('groupScore').get()
  const groupScoreSetting = groupScoreSettingSnap.data() as GroupScoreSettingType
  GroupScoreSettingCache = groupScoreSetting
  return (
    groupScoreSetting ?? {
      shouldModifyScore: false,
      shouldPatchGroupScoreData: false,
    }
  )
}

// Generate the daily log id base on an assumption that every members of a group should follow the group timezone
function getDailyLogId(time: number, timeZoneOffset: number) {
  const date = new Date(time)
  return format(add(date, { hours: date.getTimezoneOffset() / 60 - timeZoneOffset }), 'MM_dd_yyyy')
}

async function sendRemindStudyNotification(groupId: string, userId: string) {
  const groupRef = db.collection('groups').doc(groupId)
  const groupSnap = await groupRef.get()
  const group = groupSnap.data() as Carry.Group
  const planId = group.activeGoal?.id
  if (!planId) return
  const planRef = db.collection('groups').doc(groupId).collection('plans').doc(planId)
  const planSnap = await planRef.get()
  const planData = planSnap.data() as GroupPlan
  if (!planSnap.exists) return
  const groupMemberCount = group.members.length || 0
  const activeBlockIndex = Utils.getBlockIndexOfPlan(planData)
  const completedMembers = planData.blocks[activeBlockIndex - 1]?.completedMembers ?? []
  const notCompletedMembers = group.members.filter((i) => !completedMembers?.includes(i))
  if (groupMemberCount < 3 || (completedMembers && completedMembers?.length < 2)) return
  const memberCompleted1 =
    completedMembers && ((await db.doc(`/users/${completedMembers[0] || ''}`).get()).data() as Carry.User)
  const memberCompleted2 =
    completedMembers && ((await db.doc(`/users/${completedMembers[1]}`).get()).data() as Carry.User)
  const cfg = REMIND_DAILY_CONFIG.find((i) => {
    return (
      groupMemberCount >= i.minMemberTotal &&
      groupMemberCount <= i.maxMemberTotalMemberTotal &&
      i.requireCompletedTotal === completedMembers?.length
    )
  })
  if (cfg) {
    notCompletedMembers.forEach((uid) => {
      Worker.createOneTimeWorker(
        uid,
        new Date(),
        {
          title: genTran(group.name, { pure: true }),
          body: genTran(cfg.message, {
            member1: memberCompleted1?.name || '',
            member2: memberCompleted2?.name || '',
            completedMemberCount: (completedMembers && completedMembers.length - 2 + '') || '',
          }),
          event: EVENTS.remind_daily_flow,
        },
        {
          groupId: group.id,
          planId: planData.id,
        },
      )
    })
  }
}

async function updateScore({
  type,
  groupId,
  userId,
  eventTime = Date.now(),
}: {
  type: ScoreDailyActionType
  groupId: string
  userId: string
  eventTime?: number
}): Promise<number> {
  const { shouldModifyScore } = await getGroupScoreSetting()
  const groupRef = db.collection('groups').doc(groupId)
  const scoreRef = groupRef.collection('score').doc(userId)
  const groupSnap = await groupRef.get()
  if (!groupSnap.exists) {
    throw new Error(`[updateScore] Can not found groupId:${groupId}`)
  }
  const group = groupSnap.data() as Carry.Group

  let scoreSnap = await scoreRef.get()
  if (!scoreSnap.exists) {
    const data: Score = {
      total: DEFAULT_SCORE,
      updated: firestoreAdmin.Timestamp.now(),
    }
    await scoreRef.set(data, { merge: true })
    scoreSnap = await scoreRef.get()
  }

  const previousScore = (scoreSnap.data() as Score).total
  if (!shouldModifyScore) {
    return previousScore
  }

  const timeZoneOffset = group.timeZone // this actually is time offset to UTC time, ex: GMT +7 is store as -7
  const dailyLogId = getDailyLogId(eventTime, timeZoneOffset)
  const dailyLogRef = scoreRef.collection('dailyLog').doc(dailyLogId)
  const dailyLogSnap = await dailyLogRef.get()
  const logData: Partial<ScoreDailyLog> = {
    [type]: {
      createdTime: firestoreAdmin.Timestamp.now(),
      updatedTime: firestoreAdmin.Timestamp.now(),
      count: 1,
    },
  }
  let needUpdateScore = true
  if (dailyLogSnap.exists) {
    const dailyLog = dailyLogSnap.data() as ScoreDailyLog
    if (!!dailyLog[type]) {
      logData[type] = {
        ...dailyLog[type],
        updatedTime: firestoreAdmin.Timestamp.now(),
        count: dailyLog[type].count + 1,
      }
      needUpdateScore = false
    }
  }
  await dailyLogRef.set(logData, { merge: true })

  // Send notification to members has not completed the daily flow
  // https://carryapp.notion.site/Changes-to-Notifications-68f657a988744211982636399d6feba4
  if (type === ScoreDailyActionType.COMPLETE_CURRENT_DAILY_FLOW) {
    sendRemindStudyNotification(groupId, userId)
  }
  if (needUpdateScore) {
    const config = SCORE_DAILY_CONFIG[type]
    let newScore = previousScore + (config.updateMode === 'increase' ? config.value : -config.value)
    newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, newScore))
    const scoreData: Score = {
      total: newScore,
      updated: firestoreAdmin.Timestamp.now(),
    }
    await scoreRef.set(scoreData)

    return newScore
  }

  return previousScore
}

export async function recordOrgEvents({
  uid,
  groupId,
  type,
  readingMinute,
}: {
  uid: string
  groupId: string
  type: 'praise' | 'prayer' | 'reading' | 'message'
  readingMinute?: number
}) {
  try {
    let orgId = ''
    // Get Group Information
    if (!groupId) {
      logger.error(`Missing group id ${type}`)
      return
    }

    const groupRef = db.collection(collections.GROUPS).doc(groupId)
    const groupSnap = await groupRef.get()
    if (!groupSnap.exists) {
      logger.error(`[updateScore] Can not found groupId:${groupId}`)
      return
    }
    const group = groupSnap.data() as Carry.Group

    orgId = group.organisation?.id || ''
    if (!uid || !orgId) {
      logger.error(`Missing data uid: ${uid}, orgId: ${orgId}`)
      return
    }
    // Get User information
    const userRef = db.collection(collections.USERS).doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      logger.error(`Cannot found userId:${uid}`)
      return
    }
    const user = userSnap.data() as Carry.User

    // Get Org Information
    const orgRef = db.collection(collections.ORGANISATIONS).doc(orgId)
    const orgSnap = await orgRef.get()
    if (!orgSnap.exists) {
      logger.error(`Can not found orgId:${orgId}`)
      return
    }
    const org = orgSnap.data() as Carry.Organisation

    // New user in records - for UI avatar list
    const newUser = {
      uid: user.uid,
      name: user.name || '',
      image: user.image || '',
    }

    // Org case
    if (!org.recentPraise && !org.recentPrayer && !org.recentMessage && !org.recentReading) {
      // Init data for Org
      await orgRef.update(getInitRecord(type, org, newUser, readingMinute))
    } else {
      // Increase value
      const orgUpdateData = getUpdateData(type, org, newUser, readingMinute)
      if (orgUpdateData) await orgRef.update(orgUpdateData)
    }

    // Campus case
    if (group.organisation?.campusId) {
      const campusRef = orgRef.collection(collections.CAMPUS).doc(group.organisation?.campusId)
      const campusSnap = await campusRef.get()

      // Same logic from Org to Campus
      if (campusSnap.exists) {
        const campus = campusSnap.data() as Carry.Campus

        if (!campus.recentPraise && !campus.recentPrayer && !campus.recentMessage && !campus.recentReading) {
          // Init data for campus
          await campusRef.update(getInitRecord(type, campus, newUser, readingMinute))
        } else {
          const campusUpdateData = getUpdateData(type, campus, newUser, readingMinute)
          if (campusUpdateData) await campusRef.update(campusUpdateData)
        }
      }
    }

    // Group case
    const orgGroupRef = orgRef.collection(collections.GROUPS).doc(groupId)
    const orgGroupSnap = await orgGroupRef.get()
    if (orgGroupSnap.exists) {
      const orgGroup = orgGroupSnap.data() as Carry.Group
      if (!orgGroup.recentPraise && !orgGroup.recentPrayer && !orgGroup.recentMessage && !orgGroup.recentReading) {
        // Init data for group
        await orgGroupRef.update(getInitRecord(type, orgGroup, newUser, readingMinute))
      } else {
        const orgGroupUpdateData = getUpdateData(type, orgGroup, newUser, readingMinute)
        if (orgGroupUpdateData) await orgGroupRef.update(orgGroupUpdateData)
      }
    }

    // User case
    const orgUserRef = orgRef.collection(collections.MEMBERS).doc(uid)
    const orgUserSnap = await orgUserRef.get()
    if (orgUserSnap.exists) {
      const orgUser = orgUserSnap.data() as Carry.User
      if (!orgUser.totalPrayer && !orgUser.totalPraise && !orgUser.totalReadingTime) {
        // Init data for group
        await orgUserRef.update(await getInitRecordForUser(type, user, orgUser, readingMinute))
      } else {
        const orgUserUpdateData = getUpdateDataUser(type, readingMinute)
        if (orgUserUpdateData) await orgUserRef.update(orgUserUpdateData)
      }
    } else {
      // Init
      await orgUserRef.update(await getInitRecordForUser(type, user, {}, readingMinute))
    }
  } catch (e) {
    logger.error('[recordEvents]', e)
  }
}

const addItems = (user: Carry.LastUser, latestUsers: Carry.LastUser[]) => {
  const newArray = [user, ...latestUsers.filter((userItem) => userItem.uid !== user.uid)]
  if (newArray.length > 5) {
    newArray.length = 5
  }
  return newArray
}

const getUpdateData = (type: string, obj: any, newUser: Carry.LastUser, readingMinute?: number) => {
  switch (type) {
    case 'message':
      return {
        totalMessage: firestoreAdmin.FieldValue.increment(1),
        recentMessage: addItems(newUser, obj.recentMessage || []),
      }
    case 'praise':
      return {
        totalPraise: firestoreAdmin.FieldValue.increment(1),
        recentPraise: addItems(newUser, obj.recentPraise || []),
      }
    case 'prayer':
      return {
        totalPrayer: firestoreAdmin.FieldValue.increment(1),
        recentPrayer: addItems(newUser, obj.recentPrayer || []),
      }
    case 'reading':
      return {
        totalReadingTime: firestoreAdmin.FieldValue.increment(readingMinute || 1),
        recentReading: addItems(newUser, obj.recentReading || []),
      }
  }
  return null
}

const getUpdateDataUser = (type: string, readingMinute?: number) => {
  switch (type) {
    case 'message':
      return {
        totalMessage: firestoreAdmin.FieldValue.increment(1),
      }
    case 'praise':
      return {
        totalPraise: firestoreAdmin.FieldValue.increment(1),
      }
    case 'prayer':
      return {
        totalPrayer: firestoreAdmin.FieldValue.increment(1),
      }
    case 'reading':
      return {
        totalReadingTime: firestoreAdmin.FieldValue.increment(readingMinute || 1),
      }
  }
  return null
}

export const getInitRecord = (type: string, obj: any, newUser?: Carry.LastUser, readingMinute?: number) => {
  let updateData: {
    totalPraise: number
    totalPrayer: number
    totalMessage: number
    totalReadingTime: number
    recentPraise: Carry.LastUser[]
    recentPrayer: Carry.LastUser[]
    recentMessage: Carry.LastUser[]
    recentReading: Carry.LastUser[]
  } = {
    totalPraise: obj.totalPraise || 0,
    totalPrayer: obj.totalPrayer || 0,
    totalMessage: obj.totalMessage || 0,
    totalReadingTime: obj.totalReadingTime || 0,
    recentPraise: obj.mixpanelCache?.gratitude?.latestUsers || [],
    recentPrayer: obj.mixpanelCache?.prayer?.latestUsers || [],
    recentMessage: obj.mixpanelCache?.message?.latestUsers || [],
    recentReading: [],
  }

  if ((obj.mixpanelCache?.gratitude?.total || 0) > updateData.totalPraise) {
    updateData.totalPraise = obj.mixpanelCache?.gratitude?.total || 0
  }
  if ((obj.mixpanelCache?.prayer?.total || 0) > updateData.totalPrayer) {
    updateData.totalPrayer = obj.mixpanelCache?.prayer?.total || 0
  }
  if ((obj.mixpanelCache?.message?.total || 0) > updateData.totalMessage) {
    updateData.totalMessage = obj.mixpanelCache?.message?.total || 0
  }

  if (newUser && type) {
    switch (type) {
      case 'message':
        updateData.totalMessage += 1
        updateData.recentMessage = addItems(newUser, updateData.recentMessage)
        break
      case 'praise':
        updateData.totalPraise += 1
        updateData.recentPraise = addItems(newUser, updateData.recentPraise)
        break
      case 'prayer':
        updateData.totalPrayer += 1
        updateData.recentPrayer = addItems(newUser, updateData.recentPrayer)
        break
      case 'reading':
        updateData.totalReadingTime += readingMinute || 1
        updateData.recentReading = addItems(newUser, [])
        break
    }
  }

  return updateData
}

export const getInitRecordForUser = async (
  type: string,
  user: Carry.User,
  orgUser: Carry.User | any,
  readingMinute?: number,
) => {
  const groupIds = (
    await db
      .collection(collections.ORGANISATIONS)
      .doc(user.organisation?.id || '')
      .collection(collections.GROUPS)
      .where('members', 'array-contains', user.uid)
      .get()
  ).docs.map((item) => {
    return item.data().id
  })

  const actionsUser = await getActionOfUser(groupIds, true, user.uid)

  let updateData: {
    totalPraise: number
    totalPrayer: number
    totalMessage: number
    totalReadingTime: number
  } = {
    totalPrayer: Math.max(orgUser.mixpanelCache?.prayer?.total || 0, user.totalPrayer || 0, actionsUser.Prayers),
    totalPraise: Math.max(orgUser.mixpanelCache?.gratitude?.total || 0, user.totalPraise || 0, actionsUser.Gratitudes),
    totalMessage: orgUser.mixpanelCache?.message?.total || 0,
    totalReadingTime: 0,
  }
  if (type) {
    switch (type) {
      case 'message':
        updateData.totalMessage += 1
        break
      case 'praise':
        updateData.totalPraise += 1
        break
      case 'prayer':
        updateData.totalPrayer += 1
        break
      case 'reading':
        updateData.totalReadingTime += readingMinute || 1
        break
    }
  }
  return updateData
}

async function getActionOfUser(groupIds: string[], isUser: boolean = false, userId: string = '') {
  let numberPrayer: number = 0
  let numberGratitudes: number = 0
  const prayers: any[] = []
  const gratitudes: any[] = []
  for (const groupid of groupIds) {
    let actions: firestoreAdmin.QuerySnapshot<firestoreAdmin.DocumentData>
    if (isUser) {
      actions = await db
        .collection(collections.GROUPS)
        .doc(groupid)
        .collection(collections.ACTIONS)
        .where('creator', '==', userId)
        .get()
    } else {
      actions = await db.collection(collections.GROUPS).doc(groupid).collection(collections.ACTIONS).get()
    }
    actions.forEach((element) => {
      const data = element.data()
      type ObjectKey = keyof typeof data
      const myVar = 'type' as ObjectKey
      if (String(data[myVar]).toLowerCase().trim() === 'prayer') {
        numberPrayer = numberPrayer + 1
        prayers.push(data)
      }
      if (String(data[myVar]).toLowerCase().trim() === 'gratitude') {
        numberGratitudes = numberGratitudes + 1
        gratitudes.push(data)
      }
    })
  }
  return {
    Prayers: numberPrayer,
    Gratitudes: numberGratitudes,
  }
}

export default {
  getGroupScoreSetting,
  getInitRecordForUser,
  updateScore,
  recordOrgEvents,
}
