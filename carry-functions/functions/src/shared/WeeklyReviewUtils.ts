import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { add, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns'

import { Service } from './index'
import { GroupActionsType } from '../types/groupAction'
import { WeeklyReview } from '../types/weeklyReview'

const db = Service.Firebase.firestore()

// Use ISO week to generate id for each week. Each ISO week will always has 7 days and ensure no overlap year
// An ISO week will start on Monday and end on Sunday
const generateWeeklyId = (time: Date, timezoneOffset: number): { id: string; start: Date; end: Date } => {
  const offset = time.getTimezoneOffset() / 60 - timezoneOffset
  const localTime = add(time, { hours: offset })
  const week = getISOWeek(localTime)
  const year = getISOWeekYear(localTime)

  let weekStr = `${week}`
  if (week < 10) {
    weekStr = `0${week}`
  }
  return {
    id: `${year}_${weekStr}`,
    start: add(startOfISOWeek(localTime), { hours: -offset }),
    end: add(endOfISOWeek(localTime), { hours: -offset }),
  }
}

const getPreviousWeeklyReviewRef = async ({
  groupId,
  eventTime = Timestamp.now(),
}: {
  groupId: string
  eventTime?: FirebaseFirestore.Timestamp
}): Promise<FirebaseFirestore.DocumentReference | null> => {
  const groupRef = db.collection('groups').doc(groupId)
  const weeklyResult = await groupRef
    .collection('weeklyReview')
    .where('endTime', '<', eventTime)
    .orderBy('endTime', 'desc')
    .limit(1)
    .get()

  if (weeklyResult.empty) {
    return null
  }
  const weekId = weeklyResult.docs[0].data().id
  return groupRef.collection('weeklyReview').doc(weekId)
}

const getActiveWeeklyReviewRef = async ({
  groupId,
  eventTime = Timestamp.now(),
}: {
  groupId: string
  eventTime?: FirebaseFirestore.Timestamp
}): Promise<FirebaseFirestore.DocumentReference<WeeklyReview>> => {
  const groupRef = db.collection('groups').doc(groupId)
  const groupSnap = await groupRef.get()
  const group = groupSnap.data() as Carry.Group

  const { id: weekId, start, end } = generateWeeklyId(eventTime.toDate(), group.timeZone)
  const weekRef = groupRef.collection('weeklyReview').doc(weekId) as FirebaseFirestore.DocumentReference<WeeklyReview>
  const weekSnap = await weekRef.get()
  if (!weekSnap.exists) {
    await weekRef.set(
      {
        id: weekId,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
      },
      {
        merge: true,
      },
    )
  }

  return weekRef
}

const getMemberRef = async ({
  userId,
  groupId,
  eventTime = Timestamp.now(),
}: {
  userId: string
  groupId: string
  eventTime?: FirebaseFirestore.Timestamp
}): Promise<FirebaseFirestore.DocumentReference> => {
  const weekRef = await getActiveWeeklyReviewRef({ groupId, eventTime })
  return weekRef.collection('member').doc(userId)
}

type RecordEvent<T = void> = {
  userId: string
  groupId: string
  eventTime?: FirebaseFirestore.Timestamp
  data: T
}

const recordGroupAction = async ({
  userId,
  groupId,
  eventTime,
  data,
}: RecordEvent<{ type: GroupActionsType; id: string }>) => {
  const memberRef = await getMemberRef({ userId, groupId, eventTime })
  await memberRef.set(
    {
      uid: userId,
      groupActions: FieldValue.arrayUnion(data),
    },
    { merge: true },
  )
}

const recordMessage = async ({ userId, groupId, eventTime, data }: RecordEvent<{ messageId: string }>) => {
  const memberRef = await getMemberRef({ userId, groupId, eventTime })
  await memberRef.set(
    {
      uid: userId,
      messages: FieldValue.arrayUnion(data.messageId),
    },
    { merge: true },
  )
}

const recordStreak = async ({ userId, eventTime, data }: Omit<RecordEvent<{ streak: number }>, 'groupId'>) => {
  const groupsSnap = await db.collection('groups').where('members', 'array-contains', userId).get()
  if (groupsSnap.empty) {
    return
  }
  const groups = groupsSnap.docs
  await Promise.all(
    groups.map(async (groupSnap) => {
      const group = groupSnap.data() as Carry.Group
      const memberRef = await getMemberRef({ userId, groupId: group.id, eventTime })
      await memberRef.set(
        {
          uid: userId,
          streakGains: FieldValue.arrayUnion(data.streak),
        },
        { merge: true },
      )
    }),
  )
}

const recordScore = async ({ userId, groupId, eventTime, data }: RecordEvent<{ score: number }>) => {
  const memberRef = await getMemberRef({ userId, groupId, eventTime })
  await memberRef.set(
    {
      uid: userId,
      scores: FieldValue.arrayUnion(data.score),
    },
    { merge: true },
  )
}

export default {
  getPreviousWeeklyReviewRef,
  getActiveWeeklyReviewRef,
  recordGroupAction,
  recordMessage,
  recordStreak,
  recordScore,
}
