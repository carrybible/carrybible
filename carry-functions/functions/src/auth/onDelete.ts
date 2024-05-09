import admin, { firestore } from 'firebase-admin'
import { auth, logger } from 'firebase-functions'
import { Service } from '../shared'
import collections from '../types/collections'

const onDelete = auth.user().onDelete(async (user) => {
  try {
    const uid = user.uid
    const userRef = Service.Firebase.firestore().doc(`/users/${user.uid}`)
    const userDoc = await userRef.get()
    if (userDoc.exists) {
      await userRef.delete()
    }

    // Remove from all Groups
    const groupDocs = await Service.Firebase.firestore()
      .collection(collections.GROUPS)
      .where('members', 'array-contains', uid)
      .get()

    const batch = Service.Firebase.firestore().batch()
    for (const groupDoc of groupDocs.docs) {
      const group = groupDoc.data() as Carry.Group
      batch.update(groupDoc.ref, {
        members: admin.firestore.FieldValue.arrayRemove(uid),
        memberCount: admin.firestore.FieldValue.increment(-1),
        ...(uid === group.owner ? { owner: '' } : {}),
        updated: firestore.FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
  } catch (e) {
    logger.error('[ERROR] onDeleteAuth', user)
  }
})

export default onDelete
