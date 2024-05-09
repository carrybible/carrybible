import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { GroupPlan } from '../types/studyPlan'

export const getEndDate = (startDate: Date, duration: number, pace: string, timeZone: number) => {
  const start = new Date(startDate)

  // Set to timezone of user, then set time to 0:00, move back to server time.
  let startDateValue = add(start, { hours: -(timeZone || 0) })
  startDateValue.setHours(0, 0, 0, 0)
  startDateValue = add(startDateValue, { hours: timeZone || 0 })

  const endDateValue = add(startDateValue, { [`${pace}s`]: duration })
  const reduce1min = add(endDateValue, { minutes: -1 })
  return {
    start: startDateValue.getTime(),
    end: reduce1min.getTime(),
    realEnd: endDateValue,
  }
}

export const getOverlapPlans = async ({
  groupId,
  startDate,
  duration,
  pace,
  context,
}: {
  groupId: string
  startDate: number
  duration: number
  pace: string
  context: https.CallableContext
}) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''
  let data: any
  let nextPlan: GroupPlan | null = null
  let nextPlanStart = 0

  if (uid && typeof groupId === 'string') {
    try {
      const groupRef = firestore().doc(`/groups/${groupId}`)
      const group = await groupRef.get()
      const groupData = group.data() as Carry.Group

      const plansRef = await groupRef.collection('plans').get()
      const overlapList: GroupPlan[] = []
      const checkData = getEndDate(new Date(startDate), duration, pace, groupData.timeZone)
      const s = checkData.start
      const e = checkData.end

      plansRef.forEach((snapshot) => {
        const plan = snapshot.data() as GroupPlan
        if (!plan.startDate || !plan.duration || !plan.pace) return
        const { start, end } = getEndDate(plan.startDate.toDate(), plan.duration, plan.pace, groupData.timeZone)
        if (
          ((s <= start && start <= e) ||
            (s <= end && end <= e) ||
            (start <= s && s <= end) ||
            (start <= e && e <= end)) &&
          plan.status !== 'ended'
        ) {
          overlapList.push(plan)
          if (!nextPlan || nextPlanStart >= start) {
            nextPlan = plan
            nextPlanStart = start
          }
        }
      })

      success = true
      message = `Successful`
      data = overlapList
    } catch (e: any) {
      message = `Error when check valid plan`
      success = false
      data = { error: e.message }
      logger.error(message, { groupId, startDate, duration, pace })
    }
  }
  logger.info(message)
  return { success, message, data, nextPlan }
}

const checkOverlapPlans = https.onCall(
  async (props: { groupId: string; startDate: number; duration: number; pace: string }, context) => {
    return await getOverlapPlans({ ...props, context })
  },
)

export default checkOverlapPlans
