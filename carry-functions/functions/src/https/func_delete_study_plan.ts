import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const onDeletePlan = https.onCall(async ({ groupId, studyPlanId }, context) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''

  if (uid && typeof groupId === 'string') {
    try {
      const groupData = (await firestore().doc(`/groups/${groupId}`).get()).data() as Carry.Group
      if (groupData.owner !== uid) {
        success = false
        message = "You don't have permission to delete study."
      } else {
        const planRef = firestore().doc(`/groups/${groupId}/plans/${studyPlanId}`)
        await planRef.delete()
        message = `Delete plan ${groupId} success`
        success = true
      }
    } catch (e: any) {
      message = `Cannot delete plan ${groupId}, ${e?.message}`
      success = false
      logger.error(`Error delete plan of Group ${groupId}, Plan ${studyPlanId}`, e)
    }
  }

  return { success, message }
})

export default onDeletePlan
