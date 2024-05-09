import { firestore as fbAdmin } from 'firebase-admin'
import { firestore } from 'firebase-functions'
import { addPrompt, removePrompt } from '../shared/reports/syncGroupData'
import GroupActions from '../types/groupAction'

export default firestore.document('/groups/{groupId}/actions/{actionId}').onWrite(async (change, context) => {
  const nVal = change.after.data() as GroupActions | undefined
  const pVal = change.before.data() as GroupActions | undefined
  const { groupId } = context.params
  const groupDoc = await fbAdmin().collection('groups').doc(groupId).get()
  const groupData = groupDoc.data() as Carry.Group

  let isUpdate = false

  if (groupData.id) {
    if (!change.before.exists && nVal) {
      // Create case
      await addPrompt(nVal, groupData)
      isUpdate = true
    } else if (!change.after.exists && pVal) {
      // Delete case
      await removePrompt(pVal, groupData)
      isUpdate = true
    } else if (nVal && nVal?.orgSyncStatus !== pVal?.orgSyncStatus && nVal?.orgSyncStatus !== 'synced') {
      // Force sync case
      await addPrompt(nVal, groupData)
      isUpdate = true
    }

    if (isUpdate) {
      await change.after.ref.set(
        { orgSyncStatus: 'synced', updated: fbAdmin.FieldValue.serverTimestamp() },
        { merge: true },
      )
    }
  }
  return true
})
