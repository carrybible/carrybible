import { firestore, logger } from 'firebase-functions'
import { updateUnreadMapActionStep } from './utils'

export default firestore
  .document('/groups/{groupId}/actionSteps/{actionStepId}/followUps/{followUpId}')
  .onUpdate(async (change, context) => {
    const { groupId, actionStepId, followUpId } = context.params
    const nVal = change.after.data() as Carry.FollowUp
    const pVal = change.before.data() as Carry.FollowUp

    try {
      if (nVal.viewers.length !== pVal.viewers.length) {
        const currentViewers = new Set(pVal.viewers)
        const newViewers = [...new Set(nVal.viewers.filter((uid) => !currentViewers.has(uid)))]
        logger.info(`Updating unread count map of members [${newViewers}] for action step ${actionStepId}`)
        await updateUnreadMapActionStep({
          groupId,
          actionStepId,
          followUpId,
          members: newViewers,
          isDecreased: true,
        })
      }
    } catch (e) {
      logger.error(`Error when updating follow up:`, { groupId, actionStepId, followUpId }, e)
    }
  })
