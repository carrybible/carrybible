import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { EVENTS } from '../cronjobs/tasks/types'
import { Service, Utils } from '../shared'
import { genTran } from '../shared/i18n'

const func_remove_group_member = https.onCall(
  async ({ groupId, memberId, type }: { groupId: string; memberId: string; type: 'remove' | 'leave' }, context) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''

    if (uid && typeof groupId === 'string' && typeof memberId === 'string') {
      try {
        const groupRef = firestore().doc(`/groups/${groupId}`)
        const group = await groupRef.get()
        const groupData = group.data() as Carry.Group
        const channel = Service.Stream.channel('messaging', groupId)
        const promises = []

        if (type === 'remove') {
          // Leader remove member in group
          if (groupData.owner === uid) {
            await groupRef.set(
              {
                members: firestore.FieldValue.arrayRemove(memberId),
                updated: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            )
            success = true
            message = 'Remove successful!'
          } else {
            message = 'You are not the leader'
          }
        } else {
          // Members leave group by themselves
          if (groupData.members.includes(memberId)) {
            await groupRef.set(
              {
                members: firestore.FieldValue.arrayRemove(memberId),
                updated: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            )
            success = true
            message = 'Remove successful!'
          } else {
            message = 'You are not a member of group'
          }
        }

        if (success) {
          // Send notifications
          const memberRef = firestore().doc(`/users/${memberId}`)
          const memberData = (await (await memberRef.get()).data()) as Carry.User

          // Remove group in member's groups
          promises.push(
            memberRef.update({
              groups: firestore.FieldValue.arrayRemove(groupId),
              // For prevent user enter the group in next login
              latestJoinedGroup:
                memberData?.latestJoinedGroup === groupId
                  ? memberData?.groups?.find((value) => value !== groupId) || ''
                  : memberData?.latestJoinedGroup || '',
            }),
          )

          if (type === 'remove') {
            // Send notification to user
            promises.push(
              Utils.sendNotificationToUser(memberId, {
                notification: {
                  title: genTran(groupData.name, { pure: true }),
                  body: genTran('text.no-longer-belong', {
                    valGroup: groupData.name,
                  }),
                },
                data: {
                  groupId: groupId,
                  event: EVENTS.left_group,
                },
              }),
            )
          } else if (groupData.owner) {
            // Send notification to let the leader know
            promises.push(
              Utils.sendNotificationToUser(groupData.owner, {
                notification: {
                  title: genTran(groupData.name, { pure: true }),
                  body: genTran('text.left-group', {
                    valName: memberData.name,
                    valExtra: '',
                  }),
                },
                data: {
                  groupId: groupId,
                  event: EVENTS.left_group,
                },
              }),
            )
          }

          // Remove member on streamIO
          promises.push(Utils.retry(() => channel.removeMembers([memberId])))

          await Promise.all(promises)
        }
      } catch (e: any) {
        logger.error('REMOVE MEMBER API', groupId, memberId, type, message)
        message = `Fail!`
      }
    }

    return { success, response: { message } }
  },
)

export default func_remove_group_member
