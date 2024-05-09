import { firestore as fbAdmin } from 'firebase-admin'
import { firestore } from 'firebase-functions'
import { addReadingTime } from '../shared/reports/syncGroupData'

export default firestore
  .document('/groups/{groupId}/plans/{planId}/progress/{progressId}')
  .onWrite(async (change, context) => {
    const nVal = change.after.data() as any
    const pVal = change.before.data() as any
    const { groupId } = context.params
    const groupDoc = await fbAdmin().collection('groups').doc(groupId).get()
    const groupData = groupDoc.data() as Carry.Group
    if (groupData.id) {
      const result = await addReadingTime(nVal, pVal, groupData)
      if (result && nVal?.orgSyncStatus && nVal?.orgSyncStatus !== 'synced')
        await change.after.ref.set(
          { orgSyncStatus: 'synced', updated: fbAdmin.FieldValue.serverTimestamp() },
          { merge: true },
        )
    }
    return true
  })
