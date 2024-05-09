import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const onJoinGroup = https.onCall(async (groupId, context) => {
  const uid = context.auth?.uid
  let success = false
  let message = ''

  if (uid && typeof groupId === 'string') {
    try {
      const groupRef = firestore().doc(`/groups/${groupId}`)
      const group = await groupRef.get()
      const groupData = group.data() as Carry.Group

      if (groupData?.members.includes(uid)) {
        message = `User ${uid} already in ${groupId}`
        success = true
      } else {
        await groupRef.update('members', firestore.FieldValue.arrayUnion(uid))
        message = `User ${uid} join ${groupId}`
        success = true
      }
    } catch (e: any) {
      logger.error(`Error join Group ${groupId}`, e)
      message = `User ${uid} can not join ${groupId}, ${e.message}`
      success = false
    }
  }
  return { success, response: { message } }
})

export default onJoinGroup
