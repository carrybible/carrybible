import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { GroupPlan } from '../types/studyPlan'
import { getEndDate, getOverlapPlans } from './func_check_overlap_plans'
import { endStudyPlan } from './func_end_study_plan'

export const applyActivePlan = async (nextPlan: GroupPlan, groupId: string) => {
  const groupRef = firestore().doc(`/groups/${groupId}`)
  const group = await groupRef.get()
  const groupData = group.data() as Carry.Group

  if (groupData.activeGoal?.id !== nextPlan.id) {
    if (groupData?.activeGoal) {
      await endStudyPlan(groupData.id, groupData?.activeGoal.id)
    }

    const datePlan = getEndDate(nextPlan.startDate.toDate(), nextPlan.duration, nextPlan.pace, groupData.timeZone)
    let groupUpdate: any = {
      activeGoal: {
        id: nextPlan.id,
        startDate: nextPlan.startDate,
        endDate: firestore.Timestamp.fromDate(datePlan.realEnd),
        pace: nextPlan.pace,
        duration: nextPlan.duration,
        name: nextPlan.name,
      },
      updated: firestore.FieldValue.serverTimestamp(),
    }
    await groupRef.set(groupUpdate, { merge: true })
  }
}

const onTriggerChangeActivePlan = https.onCall(async ({ groupId }: { groupId: string }, context) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''
  let data: any = {}

  if (uid && typeof groupId === 'string') {
    try {
      const fakeOverlap: { success: boolean; data: GroupPlan[]; nextPlan: GroupPlan | null } = await getOverlapPlans({
        groupId,
        startDate: new Date().getTime(),
        duration: 100,
        pace: 'day',
        context,
      })

      if (fakeOverlap.success && fakeOverlap.nextPlan) {
        applyActivePlan(fakeOverlap.nextPlan, groupId)
      }

      success = true
      message = `Successfully trigger update active plan in group ${groupId}`
      data = fakeOverlap.data?.[0]
    } catch (e: any) {
      message = `Cannot create new goal for group ${groupId}, ${e.message}`
      success = false
      data = e.message
      logger.error(message)
    }
  }
  logger.info(message)
  return { success, message, data }
})

export default onTriggerChangeActivePlan
