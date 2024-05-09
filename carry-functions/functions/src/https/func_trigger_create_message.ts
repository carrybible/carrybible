import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { Service, Utils } from '../shared'
import { GroupPlan } from '../types/studyPlan'

const onTriggerCreateMessage = https.onCall(
  async ({ groupId, planId, blockIndex }: { groupId: string; planId: string; blockIndex: number }, context) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''
    let data = {}

    if (uid && typeof groupId === 'string') {
      try {
        const groupDoc = await firestore().collection('groups').doc(groupId).get()
        const groupData = groupDoc.data() as Carry.Group

        const ownerId = groupData.owner || groupData.members[0]

        const planRef = firestore().doc(`/groups/${groupId}/plans/${planId}`)
        const plan = await planRef.get()
        const planData = plan.data() as GroupPlan

        const channel = Service.Stream.channel('messaging', groupId)

        // Create and apply all channel ID for groupStudy
        const blocks = [...planData.blocks]
        // Add group owner info
        const ownerInfo = (await firestore().doc(`users/${ownerId}`).get()).data()

        if (blocks?.[blockIndex - 1]) {
          // Update messageId for today block
          const block = planData.blocks[blockIndex - 1]
          const activities = []
          for (let i = 0; i < block.activities.length; i++) {
            const activity = block.activities[i]
            if (activity.type === 'question' && !activity.messageId) {
              const messageId = await Utils.sendMessageAndGenerateThread({
                uid: ownerId,
                channel,
                question: activity.question,
                plan: planData,
                hasAttachment: false,
                startThreadDate: new Date(),
                blockIndex,
                user: ownerInfo,
              })
              activities.push({
                ...activity,
                messageId,
              })
            } else activities.push(activity)
          }
          blocks[blockIndex - 1] = {
            ...block,
            activities,
          }
        }

        await planRef.set({ blocks }, { merge: true })

        success = true
        message = `Successfully trigger message in study plan ${planId} in group ${groupId}`
        data = blocks
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

export default onTriggerCreateMessage
