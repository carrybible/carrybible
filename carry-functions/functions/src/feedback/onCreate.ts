import { firestore, logger } from 'firebase-functions'
import { UserResponse, handleFeedback } from '../bug/onCreate'

export default firestore.document('/feedbacks/{feedbackId}').onCreate(async (snap, context) => {
  const { feedbackId } = context.params
  const feedback = snap.data() as UserResponse

  try {
    await handleFeedback(feedback, 'feedback')
  } catch (e: any) {
    logger.error(`Error creating github issue for feedback ${feedbackId}:`, e.message)
  }
})
