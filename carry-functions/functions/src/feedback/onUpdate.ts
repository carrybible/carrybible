import { firestore, logger } from 'firebase-functions'
import { UserResponse, handleFeedback } from '../bug/onCreate'

export default firestore.document('/feedbacks/{feedbackId}').onUpdate(async (change, context) => {
  const { feedbackId } = context.params
  const feedback = change.after.data() as UserResponse
  try {
    if (feedback?.trigger) await handleFeedback(feedback, 'feedback')
  } catch (e: any) {
    logger.error(`Error trigger github issue for feedback ${feedbackId}:`, e.message)
  }
})
