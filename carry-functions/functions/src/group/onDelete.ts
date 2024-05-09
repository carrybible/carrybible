import { firestore, logger } from 'firebase-functions'
import { Service } from '../shared'
import { firestore as firestoreAdmin } from 'firebase-admin'
import { onUpdateGroup } from '../shared/reports/syncGroupData'

export default firestore.document('/groups/{groupID}').onDelete(async (snap, context) => {
  const { groupID } = context.params
  const group = snap.data() as Carry.Group
  await onUpdateGroup(undefined, group, snap.ref)
  try {
    const channel = Service.Stream.channel('messaging', groupID)
    await channel.delete()

    // remove group from user.groups for all users
    for (let uid of group.members) {
      const userRef = Service.Firebase.firestore().doc(`/users/${uid}`)
      await userRef.set({ groups: firestoreAdmin.FieldValue.arrayRemove(groupID) }, { merge: true })
    }

    // Remove Group Id in premiumGroupIds
    const userPath = await Service.Firebase.firestore().doc(`/users/${group.owner}`)
    if (group.subscription?.original_transaction_id) {
      // Delete in iap/{tid}: premiumGroupIds: string[]
      const iapPath = await Service.Firebase.firestore().doc(`/iap/${group.subscription.original_transaction_id}`)
      if ((await iapPath.get()).exists) {
        // Only update when iap exist
        await iapPath.update({ premiumGroupIds: firestoreAdmin.FieldValue.arrayRemove(groupID) })
      }
    } else {
      // Incase subscription expired, group data isn't have subscription, so get subscription in user data
      const userData = (await userPath.get())?.data()
      if (userData?.subscription?.original_transaction_id) {
        // If user have subscription.original_transaction_id
        const iapPath = await Service.Firebase.firestore().doc(`/iap/${userData.subscription.original_transaction_id}`)
        const iapSnapshot = await iapPath.get()
        if (iapSnapshot.exists) {
          const iapData = iapSnapshot.data()
          if (iapData?.premiumGroupIds && iapData?.premiumGroupIds.includes(groupID)) {
            await iapPath.update({ premiumGroupIds: firestoreAdmin.FieldValue.arrayRemove(groupID) })
          }
        }
      }
    }
  } catch (e: any) {
    logger.error(`Error deleting group ${groupID}:`, e.message)
  }
  return Promise.resolve()
})
