import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { Utils, Service } from '../../shared'

// This function using for manual send notification to users

const onSendNotificationToUsers = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    options: {
      // Who will get the notificaiton
      uids?: string[]
      groupIds?: string[]
      organisationIds: string[]
      exceptGroupIds?: string[] // Apply when send notification to org
      exceptUIDs?: string[] // Apply when send notification to groups

      // Notification content
      title: string
      body: string
      event?: string
    },
    context,
  ) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''

    if (!uid) {
      message = 'Unauthorized'
    } else {
      try {
        const userRef = await firestore().doc(`/users/${uid}`).get()
        const userData = userRef.data() as Carry.User
        if (userData?.isGM) {
          // Some users
          let UIDs = [...(options?.uids || [])]

          // Some groups
          if (options?.groupIds && Array.isArray(options.groupIds)) {
            for (const groupId of options.groupIds) {
              const groupRef = firestore().doc(`/groups/${groupId}`)
              const group = await groupRef.get()
              const groupData = group.data() as Carry.Group
              UIDs = [...UIDs, ...(groupData?.members || [])]
            }
          }

          // Some orgnisations
          if (
            options?.organisationIds &&
            Array.isArray(options.organisationIds) &&
            options.organisationIds.length > 0
          ) {
            const groupRefs = (
              await firestore().collection(`/groups`).where('organisation.id', 'in', options.organisationIds).get()
            ).docs
            for (const group of groupRefs) {
              const groupData = group.data() as Carry.Group
              if (!(options?.exceptGroupIds || []).includes(groupData.id)) {
                UIDs = [...UIDs, ...(groupData?.members || [])]
              }
            }
          }

          if (options?.exceptUIDs && Array.isArray(options.exceptUIDs)) {
            UIDs = clearDuplicate(UIDs, options.exceptUIDs)
          }

          // Send notifications
          if (UIDs.length > 0) {
            await Utils.sendNotificationToUsers(UIDs, {
              notification: {
                title: options.title,
                body: options.body,
                sound: 'default',
              },
              data: {
                event: options?.event || 'INFO_ONLY',
              },
            })
            message = `Sent notification to ${UIDs.length} users`
          } else {
            message = 'Not found any users!'
          }
          success = true
        } else {
          message = 'User is not admin'
        }
      } catch (error) {
        logger.error(message, error)
        message = `Send notifications error: ${error}`
      }
    }

    return { success, response: { message } }
  },
)

const clearDuplicate = (values: string[], exceptValues: string[]) => {
  const temp: { [key: string]: boolean } = {}
  exceptValues.forEach((value) => {
    temp[value] = true
  })
  return values.filter((value) => {
    if (!temp[value]) {
      temp[value] = true
      return true
    }
    return false
  })
}

export default onSendNotificationToUsers
