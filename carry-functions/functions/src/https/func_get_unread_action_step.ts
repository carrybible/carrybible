import { https, logger } from 'firebase-functions'
import { Service } from '../shared'
import { firestore as firestoreAdmin } from 'firebase-admin'

const db = Service.Firebase.firestore()

type UnreadResponse = {
  unread: {
    groupId: string
    actionStepId: string
    count: number
  }[]
}

const failedResponse = (message: string) => ({
  success: false,
  response: {
    message,
  },
})

const successResponse = (data: UnreadResponse) => ({
  success: true,
  response: {
    data,
  },
})

type Param = {
  ids: {
    groupId: string
    actionStepId: string
  }[]
}

const getUnreadActionStep = https.onCall(async ({ ids }: Param, context) => {
  const userId = context.auth?.uid
  if (!userId) {
    return failedResponse(`Can not authenticated`)
  }

  const result: UnreadResponse['unread'] = await Promise.all(
    ids.map(async ({ groupId, actionStepId }) => {
      try {
        const actionStepRef = db.collection('groups').doc(groupId).collection('actionSteps').doc(actionStepId)
        const unreadRef = actionStepRef.collection('unreadCount').doc(userId)
        const unreadSnap = await unreadRef.get()
        const unread = unreadSnap.data() as Carry.UnreadFollowUp

        if (unread) {
          return { count: unread.count, actionStepId, groupId }
        }

        const actionStep = (await actionStepRef.get()).data() as Carry.ActionStep
        await unreadRef.set(
          {
            count: actionStep.followUpCount ?? 0,
            unreadFollowUps: [],
            updated: firestoreAdmin.FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        return { count: actionStep.followUpCount ?? 0, actionStepId, groupId }
      } catch (e) {
        logger.error(`Error getting unread:`, { groupId, actionStepId }, e)
        return {
          count: 0,
          actionStepId,
          groupId,
        }
      }
    }),
  )

  return successResponse({ unread: result })
})

export default getUnreadActionStep
