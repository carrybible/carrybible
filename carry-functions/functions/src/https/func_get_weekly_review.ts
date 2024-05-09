import { https } from 'firebase-functions'
import { sortBy } from 'lodash'
import { Service, WeeklyReviewUtils } from '../shared'
import GroupActions, { GroupActionsType } from '../types/groupAction'
import { MemberWeeklyReview } from '../types/weeklyReview'

const db = Service.Firebase.firestore()

type GroupActionStat = {
  [type in GroupActionsType]: number
}

type GroupStats = {
  totalGroupActions: GroupActionStat
  totalMessages: number
  totalEngagedMembers: number
  keyContributor?: { uid: string; score: number }[]
}

type UserStats = {
  totalGroupActions: GroupActionStat
  totalMessages: number
  streakGain: number
  mostReactedGratitude?: GroupActions
}

type WeeklyReviewResponseData = {
  groupStats?: GroupStats
  userStats?: UserStats
}

const failedResponse = (message: string) => ({
  success: false,
  response: {
    message,
  },
})

const successResponse = (data: WeeklyReviewResponseData) => ({
  success: true,
  response: {
    data,
  },
})

const generateUserStats = async (
  userReviewSnap: FirebaseFirestore.DocumentSnapshot,
  groupRef: FirebaseFirestore.DocumentReference,
): Promise<UserStats | null> => {
  if (!userReviewSnap.exists) {
    return null
  }
  const userReview = userReviewSnap.data() as MemberWeeklyReview

  const groupActions = await Promise.all(
    (userReview.groupActions ?? []).map(async ({ id }) => {
      const groupActionSnap = await groupRef.collection('actions').doc(id).get()
      return groupActionSnap.data() as GroupActions
    }),
  )
  let mostReactedGratitude: GroupActions | undefined = undefined
  const totalGroupActions: GroupActionStat = {
    prayer: 0,
    gratitude: 0,
  }
  groupActions.forEach((groupAction) => {
    const { type, reactedUserIds } = groupAction
    totalGroupActions[type] = (totalGroupActions[type] ?? 0) + 1
    if (
      type === 'gratitude' &&
      reactedUserIds?.length &&
      (mostReactedGratitude?.reactedUserIds?.length ?? 0) < reactedUserIds.length
    ) {
      mostReactedGratitude = groupAction
    }
  })

  return {
    totalGroupActions,
    mostReactedGratitude,
    totalMessages: userReview.messages?.length ?? 0,
    streakGain: userReview.streakGains?.[userReview.streakGains?.length - 1] ?? 0,
  }
}

const generateGroupStats = async (
  weekRef: FirebaseFirestore.DocumentReference,
  group: Carry.Group,
): Promise<GroupStats | null> => {
  const membersSnap = await weekRef.collection('member').get()

  if (membersSnap.empty) {
    return null
  }

  const totalGroupActions: GroupActionStat = {
    prayer: 0,
    gratitude: 0,
  }
  let totalMessages = 0
  let totalEngagedMembers = 0
  let keyContributor: {
    uid: string
    score: number
  }[] = []

  const memberSet = new Set(group.members)

  membersSnap.forEach((memberSnap) => {
    const member = memberSnap.data() as MemberWeeklyReview
    if (!memberSet.has(member.uid)) {
      return
    }
    const userScore = member.scores ? member.scores[member.scores.length - 1] : 0
    totalMessages += member.messages?.length ?? 0
    totalEngagedMembers += userScore > 49 ? 1 : 0
    member.groupActions?.forEach(({ type }) => {
      totalGroupActions[type]++
    })
    if (userScore > 24 && member.uid !== group.owner) {
      keyContributor.push({ uid: member.uid, score: userScore })
    }
  })

  keyContributor = sortBy(keyContributor, ({ score }) => -score).slice(0, 3)

  return {
    totalGroupActions,
    totalMessages,
    totalEngagedMembers,
    keyContributor,
  }
}

type Param = {
  groupId: string
}

const getWeeklyReview = https.onCall(async ({ groupId }: Param, context) => {
  const userId = context.auth?.uid
  if (!userId) {
    return failedResponse(`Can not authenticated`)
  }
  const weeklyReviewSettingSnap = await db.collection('settings').doc('weeklyReview').get()
  const weeklyReviewSetting = weeklyReviewSettingSnap.data()

  let weekRef = await WeeklyReviewUtils.getPreviousWeeklyReviewRef({ groupId })
  if (weeklyReviewSetting?.shouldUseThisWeekData) {
    weekRef = await WeeklyReviewUtils.getActiveWeeklyReviewRef({ groupId })
  }
  if (!weekRef) {
    return failedResponse(`There is no weekly review for last week`)
  }

  const groupRef = db.collection('groups').doc(groupId)
  const groupSnap = await groupRef.get()
  const group = groupSnap.data() as Carry.Group
  const isOwner = group.owner === userId

  const userReviewRef = weekRef.collection('member').doc(userId)
  const userReviewSnap = await userReviewRef.get()
  if (!isOwner && !userReviewSnap.exists) {
    return failedResponse(`There is no weekly review for last week`)
  }

  const userStats = await generateUserStats(userReviewSnap, groupRef)
  const groupStats = await generateGroupStats(weekRef, group)

  if (!userStats && !groupStats) {
    return failedResponse(`There is no weekly review for last week`)
  }

  return successResponse({
    userStats: userStats ?? undefined,
    groupStats: groupStats ?? undefined,
  })
})

export default getWeeklyReview
