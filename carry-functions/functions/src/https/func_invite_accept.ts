import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const onCallAcceptInvite = https.onCall(async (inviteID, context) => {
  const uid = context.auth?.uid
  let success = false
  let invite
  let message = ''
  let isValid = true

  if (uid && typeof inviteID === 'string') {
    try {
      const inviteRef =
        inviteID.length <= 10 ? firestore().doc(`/codes/${inviteID}`) : firestore().doc(`/invites/${inviteID}`)
      const inviteDoc = await inviteRef.get()
      invite = inviteDoc.exists ? (inviteDoc.data() as Carry.Invite) : undefined
      // Add user to group
      if (invite && invite.groupId) {
        const groupRef = firestore().doc(`/groups/${invite.groupId}`)
        const group = await groupRef.get()
        const groupData = group.data() as Carry.Group

        // if we create a group outside of the app, it will have no owner - the first person to accept invite becomes invite
        if ((groupData.owner === undefined || groupData.owner === '') && groupData.memberCount === 0) {
          await groupRef.update({ owner: uid })

          if (groupData.activeGoal !== undefined) {
            let planId = groupData.activeGoal?.id
            const groupPlanRef = firestore().doc(`/groups/${invite.groupId}/plans/${planId}`)
            await groupPlanRef.update({ owner: uid, author: uid })
          }

          groupData.owner = uid
        }

        await groupRef.set({ members: firestore.FieldValue.arrayUnion(uid) }, { merge: true })
        logger.info(`Invite accepted, adding user ${uid} to ${groupData.id}`)

        success = true
        const orgId = groupData.organisation?.id
        const campusId = groupData.organisation?.campusId
        const userRef = firestore().doc(`/users/${uid}`)

        let userUpdate: any = {
          groups: firestore.FieldValue.arrayUnion(invite.groupId),
        }

        // if group is org group, associate the user with the org
        if (orgId) {
          const userSnap = await userRef.get()
          const userData = userSnap?.data()
          if (!userData?.organisation) {
            // only support a single organisation
            // when user join group in org, auto add user to org and campus
            logger.info(`Setting org ${orgId} for user ${uid}`)
            userUpdate.organisation = { id: orgId, role: 'member', ...(campusId ? { campusId } : {}) }
          }
        }

        await userRef.set(userUpdate, { merge: true })
      }

      // Update acceptance and acceptCount
      if (isValid && invite && !invite.acceptance?.includes(uid)) {
        await inviteRef.set(
          {
            acceptCount: firestore.FieldValue.increment(1),
            acceptance: invite.acceptance ? firestore.FieldValue.arrayUnion(uid) : [uid],
          },
          { merge: true },
        )
        success = true
      }
    } catch (e) {
      message = `Could not accept invitation`
      logger.error(`Error accept invite Invite ${inviteID}`, e)
    }
  } else logger.error('AcceptInvite missing id:', inviteID)

  return { success, response: { invite, message } }
})

export default onCallAcceptInvite
