import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { Service, Utils } from '../shared'
import { GroupPlan, UserPlan } from '../types/studyPlan'
import { endStudyPlan } from './func_end_study_plan'

/*
ONLY FIX BUG APPLY TO THIS FUNCTION
USING FOR VERSION UNDER 1.1
*/

const onCreateGoal = https.onCall(
  async ({ groupId, userPlan, startDate }: { groupId: string; userPlan: UserPlan; startDate: number }, context) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''
    let data = {}

    if (!groupId || !userPlan) {
      message = 'Missing groupId or plan data'
    }

    if (uid && typeof groupId === 'string' && groupId && userPlan) {
      try {
        const groupRef = firestore().doc(`/groups/${groupId}`)
        const group = await groupRef.get()
        const groupData = group.data() as Carry.Group

        const channel = Service.Stream.channel('messaging', groupId)
        const groupPlanRef = firestore().collection('groups').doc(groupId).collection('plans').doc()

        const startThreadDate = new Date(startDate)
        let startDateValue = add(startThreadDate, { hours: -(groupData.timeZone || 0) })
        startDateValue.setHours(0, 0, 0, 0)
        startDateValue = add(startDateValue, { hours: groupData.timeZone || 0 })

        const groupStudyPlan: GroupPlan = {
          ...userPlan,
          id: groupPlanRef.id,
          originalId: userPlan.id || '',
          targetGroupId: groupId,
          status: 'normal',
          startDate: firestore.Timestamp.fromDate(startDateValue),
          created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
          updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
          memberProgress: {
            [uid]: {
              uid: uid,
              isCompleted: false,
              percent: 0,
              totalReadingTime: 0,
            },
          },
        }
        // Create and apply all channel ID for groupStudy
        const blocks = [...groupStudyPlan.blocks]
        const userInfo = (await firestore().doc(`users/${uid}`).get()).data()

        if (blocks.length > 0) {
          // Update messageId for first block
          const block = groupStudyPlan.blocks[0]
          const activities = []
          for (let i = 0; i < block.activities.length; i++) {
            const activity = block.activities[i]
            if (activity.type === 'question') {
              const messageId = await Utils.sendMessageAndGenerateThread({
                uid,
                channel,
                question: activity.question,
                plan: groupStudyPlan,
                hasAttachment: false,
                startThreadDate: startThreadDate,
                blockIndex: 1,
                user: userInfo,
              })
              activities.push({
                ...activity,
                messageId,
              })
            } else activities.push(activity)
          }
          blocks[0] = {
            ...block,
            activities,
          }
        }

        await groupPlanRef.set({ ...groupStudyPlan, blocks })

        if (groupData?.activeGoal && groupData?.activeGoal.status !== 'ended') {
          await endStudyPlan(groupId, groupData?.activeGoal.id)
        }

        let groupUpdate: any = {
          activeGoal: {
            id: groupPlanRef.id,
            startDate: firestore.Timestamp.fromDate(startDateValue),
            endDate: firestore.Timestamp.fromDate(add(startDateValue, { [`${userPlan.pace}s`]: userPlan.duration })),
            pace: userPlan.pace,
            duration: userPlan.duration,
            name: userPlan.name,
          },
        }

        if (userPlan.id) {
          groupUpdate.previousPlans = firestore.FieldValue.arrayUnion(userPlan.id)
        }

        await groupRef.update(groupUpdate)
        success = true
        message = `Successfully apply study ${groupStudyPlan.id} in group ${groupId}`
        data = groupStudyPlan
      } catch (e: any) {
        message = `Cannot create new goal for group ${groupId}, ${e.message}`
        success = false
        logger.error(message)
      }
    }
    logger.info(message)
    return { success, message, data }
  },
)

export default onCreateGoal
