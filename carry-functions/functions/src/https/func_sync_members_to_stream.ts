import * as functions from 'firebase-functions'
import { Service } from '../shared'

const db = Service.Firebase

const onCallSyncMembers = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onCall(async ({ groupId }) => {
    const groupsRef = db.firestore().collection('groups').doc(groupId)
    const groupSnapshot = await groupsRef.get()
    const group = groupSnapshot.data() as Carry.Group

    if (group?.id && group?.members) {
      try {
        const channel = Service.Stream.channel('messaging', group.id)
        const cMembers = await channel.queryMembers({}, {}, { limit: 300 })
        const memberIds: any = {}
        cMembers.members.forEach((member) => {
          memberIds[`${member?.user_id}`] = member
        })
        const addMemberIds: string[] = []
        group.members.forEach((uid) => {
          if (!memberIds[uid] && addMemberIds.length < 100) {
            //add_members must contain at maximum 100 items
            addMemberIds.push(uid)
          }
        })
        if (addMemberIds.length > 0) {
          await channel.addMembers(addMemberIds)
          return {
            success: true,
            message: 'Added some members to Group',
            data: {
              groupId: groupId,
              addedMembers: addMemberIds,
            },
          }
        } else {
          return {
            success: true,
            message: 'The group has been updated',
            data: {
              groupId: groupId,
              addedMembers: addMemberIds,
            },
          }
        }
      } catch (e) {
        return {
          success: false,
          message: String(e),
          data: {
            groupId: groupId,
          },
        }
      }
    }

    return {
      success: false,
      message: 'Missing group ID or group Members',
      data: {
        groupId: groupId,
      },
    }
  })

export default onCallSyncMembers
