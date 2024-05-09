import { https, logger } from 'firebase-functions'

import { ScoreDailyActionType, SendMessageEvents } from '../types/score'
import { ScoreUtils } from '../shared'

type Param = {
  type: ScoreDailyActionType
  groupId: string
}

const failedResponse = (message: string) => ({
  success: false,
  response: {
    message,
  },
})

const successResponse = (score: number) => ({
  success: true,
  response: {
    score,
  },
})
const updateGroupActivityScore = https.onCall(async ({ type, groupId }: Param, context) => {
  const userId = context.auth?.uid
  if (!userId) {
    return failedResponse(`Can not authenticated`)
  }

  // Update count message for organisation
  if (SendMessageEvents.includes(type)) {
    await ScoreUtils.recordOrgEvents({
      uid: userId,
      groupId,
      type: 'message',
    })
  }

  try {
    const score = await ScoreUtils.updateScore({
      type: [ScoreDailyActionType.CREATE_PRAYER_ACTION, ScoreDailyActionType.CREATE_GRATITUDE_ACTION].includes(type)
        ? ScoreDailyActionType.CREATE_GROUP_ACTION
        : type,
      groupId,
      userId,
    })
    logger.log(`Update score of user ${userId} in group ${groupId} to ${score} with event ${type}`)
    return successResponse(score)
  } catch (e) {
    logger.error(`Update group activity score failed with params: ${{ type, groupId, userId }}`, e)
    return failedResponse(`Something went wrong`)
  }
})

export default updateGroupActivityScore
