import { differenceInHours, differenceInMinutes, format, startOfToday, startOfTomorrow, sub } from 'date-fns'
import * as functions from 'firebase-functions'

import { ScoreUtils, Service } from '../shared'
import { ScoreDailyActionType } from '../types/score'

const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '1GB',
}

// Get a range of timezone offset that current local time is in [00:30 -> 01:00]
const getMidnightTimezoneOffsetRange = (time: number): [number, number] => {
  let midnight = startOfToday()
  if (Math.abs(differenceInHours(time, midnight)) >= 12) {
    midnight = startOfTomorrow()
  }

  const timezoneOffset = differenceInMinutes(time, midnight)
  const timezoneOffsetRange = [timezoneOffset, timezoneOffset + (timezoneOffset < 0 ? -30 : 30)]
    .map((offset) => offset - 30)
    .sort((a, b) => a - b)
  return timezoneOffsetRange.map((offset) => offset / 60.0) as [number, number]
}

const db = Service.Firebase.firestore()

const reduceGroupScore = async () => {
  const now = Date.now()
  const [start, end] = getMidnightTimezoneOffsetRange(now)
  const groups = await db.collection('groups').where('timeZone', '>=', start).where('timeZone', '<', end).get()
  functions.logger.log(
    `Reducing group score for groups in timezone offset [${start}, ${end}], found ${groups.size} group(s) in this range`,
  )
  if (groups.size === 0) {
    return
  }

  const reduceScoreList: { userId: string; groupId: string }[] = []
  groups.forEach((groupSnap) => {
    const group = groupSnap.data() as Carry.Group
    if (group.members.length === 0) {
      return
    }
    functions.logger.log(
      `[${group.id}] Local time at this group is ${format(
        sub(now, {
          hours: group.timeZone,
        }),
        'hh:mm:ss dd/MM/yyyy',
      )}`,
    )
    reduceScoreList.push(
      ...group.members.map((userId) => ({
        userId,
        groupId: group.id,
      })),
    )
  })
  await Promise.all(
    reduceScoreList.map(async ({ groupId, userId }) => {
      const newScore = await ScoreUtils.updateScore({
        groupId,
        userId,
        eventTime: now,
        type: ScoreDailyActionType.END_DAY_REDUCTION,
      })
      functions.logger.log(`[${groupId}] Reduced score of user ${userId} to ${newScore}`)
    }),
  )
}

const updateGroupScore = functions
  .runWith(runtimeOpts)
  .pubsub.schedule('every 30 minutes from 00:00 to 23:59')
  .timeZone('UTC')
  .onRun(reduceGroupScore)

export default updateGroupScore
