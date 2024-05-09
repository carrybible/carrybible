import { firestore, logger } from 'firebase-functions'
import { firestore as firestoreAdmin } from 'firebase-admin'
import { Service } from '../shared'
import { updateUnreadMapActionStep } from './utils'

const db = Service.Firebase.firestore()

export default firestore
  .document('/groups/{groupId}/actionSteps/{actionStepId}/followUps/{followUpId}')
  .onCreate(async (snap, context) => {
    const { groupId, actionStepId, followUpId } = context.params
    const followUp = snap.data() as Carry.FollowUp
    const uid = followUp.creatorInfo.userId

    const groupRef = db.collection('groups').doc(groupId)
    const actionStepRef = groupRef.collection('actionSteps').doc(actionStepId)

    try {
      logger.info(`Updating followUpCount action step ${actionStepId}`)
      await actionStepRef.update({
        followUpMembers: firestoreAdmin.FieldValue.arrayUnion(uid),
        completedMembers: firestoreAdmin.FieldValue.arrayUnion(uid),
        followUpCount: firestoreAdmin.FieldValue.increment(1),
        updated: firestoreAdmin.FieldValue.serverTimestamp(),
      })

      const groupSnap = await groupRef.get()
      const group = groupSnap.data() as Carry.Group
      await updateUnreadMapActionStep({
        groupId,
        actionStepId,
        followUpId,
        members: group.members.filter((member) => member !== uid),
      })
      // Ensure creator also has a document in unreadCount collection
      await actionStepRef
        .collection('unreadCount')
        .doc(uid)
        .set(
          {
            count: firestoreAdmin.FieldValue.increment(0),
            updated: firestoreAdmin.FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
    } catch (e) {
      logger.error(`Error when creating follow up:`, { groupId, actionStepId, followUpId }, e)
    }
  })
