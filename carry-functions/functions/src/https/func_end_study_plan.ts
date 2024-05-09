import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'

export async function endStudyPlan(
  groupId: string,
  studyPlanId?: string,
): Promise<{ success: boolean; message: string }> {
  if (groupId && studyPlanId) {
    try {
      // Update goal status to ended
      const planRef = firestore().doc(`/groups/${groupId}/plans/${studyPlanId}`)

      await planRef.set({ status: 'ended', updated: firestore.FieldValue.serverTimestamp() }, { merge: true })

      return { success: true, message: `Plan ${studyPlanId} is successfully ended` }
    } catch (e) {
      logger.error(e)
      return { success: false, message: `Plan ${studyPlanId} cannot end!` }
    }
  }
  return { success: false, message: `Plan ${studyPlanId} cannot end: Missing IDs` }
}

/*
  End plan flow:
  1. Update status of plan to ended.
  2. Remove active plan
*/

const onEndStudyPlan = https.onCall(async ({ groupId, studyPlanId }, context) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''

  if (uid && typeof groupId === 'string') {
    try {
      const groupData = (await firestore().doc(`/groups/${groupId}`).get()).data() as Carry.Group
      if (groupData.owner !== uid) {
        success = false
        message = "You don't have permission to end study."
      } else {
        const result = await endStudyPlan(groupId, studyPlanId)
        return result
      }
    } catch (e: any) {
      message = `Cannot end plan ${groupId}, ${e?.message}`
      success = false
      logger.error(`Error end goal of Group ${groupId}, Plan ${studyPlanId}`, e)
    }
  }

  return { success, message }
})

export default onEndStudyPlan
