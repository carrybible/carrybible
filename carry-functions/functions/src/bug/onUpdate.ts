import { firestore, logger } from 'firebase-functions'
import { UserResponse, handleFeedback } from '../bug/onCreate'

export default firestore.document('/bugs/{bugId}').onUpdate(async (change, context) => {
  const { bugId } = context.params
  const bug = change.after.data() as UserResponse
  try {
    if (bug?.trigger) await handleFeedback(bug, 'bug')
  } catch (e: any) {
    logger.error(`Error trigger github issue for bug ${bugId}:`, e.message)
  }
})
