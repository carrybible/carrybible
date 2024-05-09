import { firestore, firestore as firestoreAdmin } from 'firebase-admin'
import { logger } from 'firebase-functions'
import { Service } from '../shared'

const db = Service.Firebase.firestore()

export const updateUnreadMapActionStep = async ({
  groupId,
  actionStepId,
  followUpId,
  members,
  isDecreased = false,
}: {
  groupId: string
  actionStepId: string
  followUpId: string
  members: string[]
  isDecreased?: boolean
}) => {
  logger.info(`Updating unread map for action step ${actionStepId}`)
  const groupRef = db.collection('groups').doc(groupId)
  const actionStepRef = groupRef.collection('actionSteps').doc(actionStepId)
  const unreadMapRef = actionStepRef.collection('unreadCount')

  await Promise.all(
    members.map(async (member) => {
      const memberUnreadRef = unreadMapRef.doc(member)
      let count: number | firestore.FieldValue = firestoreAdmin.FieldValue.increment(isDecreased ? -1 : 1)
      if (isDecreased) {
        const unreadSnap = await memberUnreadRef.get()
        const unread = unreadSnap.data() as Carry.UnreadFollowUp
        if (unread.count <= 0) {
          count = 0
        }
      }
      return memberUnreadRef.set(
        {
          count,
          unreadFollowUps: isDecreased
            ? firestoreAdmin.FieldValue.arrayRemove(followUpId)
            : firestoreAdmin.FieldValue.arrayUnion(followUpId),
          updated: firestoreAdmin.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }),
  )
}
