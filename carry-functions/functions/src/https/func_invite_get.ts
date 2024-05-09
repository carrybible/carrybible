import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const onCallGetInvite = https.onCall(async (inviteID, context) => {
  const uid = context.auth?.uid
  let isGroupMember = false
  let success = false
  let group
  let inviter
  let message = ''

  if (uid && typeof inviteID === 'string') {
    try {
      const invite = (await firestore()
        .doc(`/invites/${inviteID}`)
        .get()
        .then((doc) => doc.data())) as Carry.Invite

      if (invite.groupId && invite.uid) {
        group = (await firestore()
          .doc(`/groups/${invite.groupId}`)
          .get()
          .then((doc) => doc.data())) as Carry.Group

        inviter = (await firestore()
          .doc(`/users/${invite.uid}`)
          .get()
          .then((doc) => doc.data())) as Carry.User

        isGroupMember = group?.members?.includes?.(uid)

        success = true
      }
    } catch (e) {
      logger.error(`Error call get invite Invite ${inviteID}`, e)
      message = `This invite may have expired, or\nyou might not have permission to\njoin the group...`
    }
  } else logger.log('invite', inviteID)

  return { success, response: { isGroupMember, group, inviter, message } }
})

export default onCallGetInvite
