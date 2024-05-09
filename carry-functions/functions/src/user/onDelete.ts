import { firestore } from 'firebase-functions'
import { onUpdateUser } from '../shared/reports/syncGroupData'

export default firestore.document('/users/{userID}').onDelete(async (snap, context) => {
  // Get some context from the Ref variables
  const old = snap.data() as Carry.User
  await onUpdateUser(undefined, old, snap.ref)
})
