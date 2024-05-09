import { firestore } from 'firebase-admin'
import * as functions from 'firebase-functions'

const getInviteLink = functions.https.onCall(async (data, context) => {
  try {
    const inviteId = data.inviteId

    if (inviteId !== null && inviteId !== '') {
      const inviteRef = firestore().doc(`/invites/${inviteId}`)
      const invite = (await inviteRef.get().then((d) => d.data())) as Carry.Invite

      if (invite !== null && invite.url !== null && invite.url !== '') {
        return {
          url: invite.url,
        }
      } else {
        throw new Error('Cannot find invite')
      }
    } else {
      throw new Error('No valid invite ID sent')
    }
  } catch (e: any) {
    return { e }
  }
})

export default getInviteLink
