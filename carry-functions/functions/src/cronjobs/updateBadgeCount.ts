import { sub } from 'date-fns'
import { logger, pubsub } from 'firebase-functions'

import { Service, Utils } from '../shared'
import GroupActions from '../types/groupAction'

type UpdateBadgeCountMessagePubSubType = {
  users: string[]
  groupId: string
}

const db = Service.Firebase.firestore()

const getGroupActionCount = async (userId: string, groupId: string): Promise<number> => {
  const beginningOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const checkDate = Service.Firebase.firestore.Timestamp.fromDate(sub(beginningOfToday, { days: 7 }))
  let isHavingUnreadPrayer = false
  let isHavingUnreadGratitude = false
  const snap = await db
    .collection('groups')
    .doc(groupId)
    .collection('actions')
    .where('created', '>', checkDate)
    .limit(100)
    .get()

  snap.forEach((doc) => {
    const data = doc.data() as GroupActions
    if (!data.viewerIds.includes(userId)) {
      if (data.type === 'prayer') {
        isHavingUnreadPrayer = true
      } else {
        isHavingUnreadGratitude = true
      }
    }
  })

  if (isHavingUnreadGratitude && isHavingUnreadPrayer) {
    return 2
  } else if (isHavingUnreadGratitude || isHavingUnreadPrayer) {
    return 1
  }
  return 0
}

const getUnreadPrivateMessageCount = async (userId: string, groupId: string): Promise<number> => {
  const groupInfoSnap = await db.collection('groups').doc(groupId).get()
  const groupInfo = groupInfoSnap.data() as Carry.Group
  const channels = await Service.Stream.queryChannels({
    type: 'messaging',
    members: { $in: [userId] },
    member_count: { $eq: 2 },
    groupId: { $eq: groupId },
    $and: [{ members: { $in: groupInfo.members.filter((member) => member !== userId) } }],
  })
  let count = 0
  channels.forEach((channel) => {
    // @ts-ignore
    if (channel.state.read[userId]?.unread_messages > 0) {
      count++
    }
  })

  return count
}

const getBadgeCountForUser = async (userId: string, groupId: string): Promise<{ userId: string; count: number }> => {
  const totalCount = (
    await Promise.all([getGroupActionCount(userId, groupId), getUnreadPrivateMessageCount(userId, groupId)])
  ).reduce((total, count) => total + count, 0)
  return {
    userId,
    count: totalCount,
  }
}

const updateBadgeCount = pubsub.topic('update-badge-count').onPublish(async (message, context) => {
  try {
    const data = message.json as UpdateBadgeCountMessagePubSubType
    const { users, groupId } = data
    logger.info('UpdateBadgeCount: ', users, groupId)
    const userList = await db.getAll(...users.map((userId) => db.collection('users').doc(userId)), {
      fieldMask: ['uid', 'latestJoinedGroup'],
    })
    // Only update badge count for user that have default group is groupId
    const filteredUserIds = userList
      .filter((user) => {
        const userData = user.data()
        const userDefaultGroupId = userData?.latestJoinedGroup
        return userDefaultGroupId === groupId
      })
      .map((user) => user.id)
    if (filteredUserIds.length === 0) {
      logger.info('No user available')
      return
    }
    const usersBadgeCount = await Promise.all(filteredUserIds.map((userId) => getBadgeCountForUser(userId, groupId)))
    logger.info('Updating badge count for users: ', usersBadgeCount)
    await Utils.updateBadgeCountToUsers(usersBadgeCount)
  } catch (e) {
    logger.error('Error in updateBadgeCount function', e)
  }
  return true
})

export default updateBadgeCount
