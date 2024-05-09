import { firestore, logger } from 'firebase-functions'
import { Service } from '../shared'
import { GroupPlan } from '../types/studyPlan'

const db = Service.Firebase.firestore()

export default firestore.document('/groups/{groupId}/plans/{planId}').onDelete(async (snap, context) => {
  const { groupId, planId } = context.params

  const plan = snap.data() as GroupPlan
  try {
    const messageIds: string[] = []
    plan.blocks.forEach((block) => {
      block.activities.forEach((activity) => {
        if (activity.type === 'question' && activity.messageId) {
          messageIds.push(activity.messageId)
        }
      })
    })
    for (let i = 0; i < messageIds.length; i++) {
      try {
        await Service.Stream.deleteMessage(messageIds[i], true)
        const thread = db.doc(`groups/${groupId}/threads/${messageIds[i]}`)
        if ((await thread.get()).exists) {
          await thread.delete()
        }
      } catch (e) {
        logger.error(`Unable to delete Message ${messageIds[i]} of Plan ${planId} in Group ${groupId}`, e)
      }
    }
    logger.info(`Deleted all messageId for Plan ${planId} of Group ${groupId}`)
  } catch (error) {
    logger.error(`Error on delete messageId for Plan ${planId} of Group ${groupId}`, error)
  }
})
