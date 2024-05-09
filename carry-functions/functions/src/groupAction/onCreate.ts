import { firestore, logger } from 'firebase-functions'
import { EVENTS } from '../cronjobs/tasks/types'
import Worker from '../cronjobs/tasks/workers'

import { Service, Utils, WeeklyReviewUtils } from '../shared'
import { genTran } from '../shared/i18n'
import GroupActions from '../types/groupAction'

const db = Service.Firebase.firestore()

export default firestore.document('/groups/{groupId}/actions/{actionId}').onCreate(async (snap, context) => {
  const { groupId, actionId } = context.params

  try {
    const action = snap.data() as GroupActions
    if (!action.creator || !action.type) {
      logger.error(`Invalid group action created`, action)
      return
    }

    const groupSnap = await db.doc(`/groups/${groupId}`).get()

    const userRef = await db.doc(`/users/${action.creator}`).get()
    const creater = userRef.data() as Carry.User

    const group = groupSnap.data() as Carry.Group
    let memberToSendNoti = group.members.filter((userId) => action.creator !== userId)
    if (group.muteMembers) {
      memberToSendNoti = group.members.filter((m) => !group.muteMembers?.includes(m))
    }

    logger.info('List member to send noti', groupId, actionId, memberToSendNoti)

    await Utils.publishBadgeCountUpdateTask(memberToSendNoti, groupId)
    try {
      memberToSendNoti.forEach((uid) => {
        Worker.createOneTimeWorker(
          uid,
          new Date(),
          {
            title: genTran(creater.name, { pure: true }),
            body: genTran(action.type === 'prayer' ? `text.raise-prayer-request` : `text.shared-praise-report`),
            event: EVENTS.group_action_created,
          },
          {
            actionId,
            groupId,
          },
        )
      })
    } catch (e) {
      logger.info(`Create notification successfully for group action ${actionId} of group ${groupId}`)
    }

    await WeeklyReviewUtils.recordGroupAction({
      userId: action.creator,
      groupId,
      data: {
        id: action.id,
        type: action.type,
      },
    })

    logger.info(`Create notification successfully for group action ${actionId} of group ${groupId}`)
  } catch (error) {
    logger.error(`Error on create notification for group action ${actionId} of group ${groupId}`, error)
  }
})
