import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { GroupPlan } from '../types/studyPlan'

const onUpdatePlanStartDate = https.onCall(async ({ groupId, studyPlanId, startDate }, context) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''

  if (uid && typeof groupId === 'string') {
    try {
      const groupRef = firestore().doc(`/groups/${groupId}`)
      const groupData = (await groupRef.get()).data() as Carry.Group
      const startDateValue = new Date(startDate)
      if (groupData.owner !== uid) {
        success = false
        message = "You don't have permission to udpate plan start date."
      } else {
        const planRef = firestore().doc(`/groups/${groupId}/plans/${studyPlanId}`)
        const planData = (await planRef.get()).data() as GroupPlan

        if (groupData.activeGoal?.id === planData.id) {
          await groupRef.set(
            {
              activeGoal: {
                id: planData.id,
                startDate: firestore.Timestamp.fromDate(startDateValue),
                endDate: firestore.Timestamp.fromDate(
                  add(startDateValue, { [`${planData.pace}s`]: planData.duration }),
                ),
                pace: planData.pace,
                duration: planData.duration,
                name: planData.name,
              },
              updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
            },
            { merge: true },
          )
        }

        await planRef.set(
          {
            startDate: firestore.Timestamp.fromDate(startDateValue),
            updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
          },
          { merge: true },
        )
        message = `Update plan start date ${groupId} success`
        success = true
      }
    } catch (e: any) {
      message = `Cannot udpate plan start date ${groupId}, ${e?.message}`
      success = false
      logger.error(`Error plan start date of Group ${groupId}, Plan ${studyPlanId}`, e)
    }
  }

  return { success, message }
})

export default onUpdatePlanStartDate
