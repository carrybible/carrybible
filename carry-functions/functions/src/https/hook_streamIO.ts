import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { https, logger } from 'firebase-functions'
import { Service, Utils, WeeklyReviewUtils } from '../shared'

const db = Service.Firebase.firestore()

const getGroupIdFromChannel = async (channelId: string): Promise<string | null> => {
  if (channelId.startsWith('private-')) {
    const channels = await Service.Stream.queryChannels({
      id: channelId,
    })
    if (channels.length === 0 || !channels[0].data?.groupId) {
      return null
    }
    return channels[0].data?.groupId as string
  }

  return channelId
}

// Type: https://getstream.io/chat/docs/react/webhook_events/#message.new
const updateBadgeCountDirectMessage = async (data: any) => {
  const sender = data.message.user
  const receivers = data.members
    .filter((member: any) => member.user_id !== sender.id)
    .map((member: any) => member.user_id)
  if (receivers.length === 0) {
    logger.info('UpdateBadgeCount: Not found receivers', data)
    return
  }
  const groupId = await getGroupIdFromChannel(data.channel_id)
  if (!groupId) {
    logger.info('UpdateBadgeCount: Not found channel', data)
    return
  }
  await Utils.publishBadgeCountUpdateTask(receivers, groupId)
}

const recordNewMessage = async (data: any) => {
  const sender = data.message.user
  const groupId = await getGroupIdFromChannel(data.channel_id)
  if (!groupId) {
    logger.info('RecordNewMessage: Not found group for channel', data)
    return
  }
  await WeeklyReviewUtils.recordMessage({
    userId: sender.id,
    groupId,
    data: {
      messageId: data.message.id,
    },
  })
}

export default https.onRequest(async (req, res) => {
  if (req.headers['target-agent'] !== 'Stream Webhook Client') {
    res.status(200).send(true)
    return
  }

  // message.new
  if (req.body.type === 'message.new') {
    if (req.body.message.type === 'reply') {
      // regular | reply
      const groupId = req.body.channel_id
      const parentMessageId = req.body.message.parent_id
      const participants = req.body.thread_participants

      // check if parent id exist in thread collection
      const parentMessageRef = db.doc(`groups/${groupId}/threads/${parentMessageId}`)
      const parentMessage = await parentMessageRef.get()
      if (parentMessage.exists) {
        const threadData = parentMessage.data() as Carry.Thread
        const m: any = await Service.Stream.getMessage(parentMessageId)
        const thread: any = {
          id: parentMessageId,
          text: m.message.text,
          replyCount: m.message.reply_count || 1,
          participantIds: participants.map((p: any) => p.id),
          participants,
          creator: m.message.user,
          creatorId: m.message.user?.id,
          type: threadData.type || 'thread',
          updated: FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        }
        thread.replyCount = Math.max(thread.replyCount, parentMessage.data()?.replyCount)
        await parentMessageRef.set(thread, { merge: true })

        // Update unreadThreads for all others members in group
        const group = (await db.doc(`groups/${groupId}`).get()).data() as Carry.Group | undefined
        if (group) {
          const sender = req.body.message.user
          const threadStartDate = Timestamp.fromDate(threadData.startDate.toDate())
          await Promise.all(
            group.members.map(async (userId) => {
              const unreadRef = parentMessageRef.collection(`unreadThreads`).doc(userId)
              await unreadRef.set(
                {
                  uid: userId,
                  groupId,
                  threadId: parentMessageId,
                  planId: threadData.planID,
                  threadStartDate,
                  updated: FieldValue.serverTimestamp(),
                  isUnread: userId !== sender.id,
                } as Carry.UnreadThread,
                { merge: true },
              )
            }),
          )
        }
      }
    }
    const channelId = req.body.channel_id
    // Check if this channel is a direct message channel or not
    if (channelId.startsWith('private-')) {
      await updateBadgeCountDirectMessage(req.body)
    }

    await recordNewMessage(req.body)

    if (req.body.message.attachments && req.body.message.attachments.length > 0) {
      const sender = req.body.message.user
      const attachment = req.body.message.attachments[0]
      const isGroupActionReactMessage = attachment.type === 'groupAction'
      if (isGroupActionReactMessage) {
        const { id, groupId } = attachment
        await db
          .collection('groups')
          .doc(groupId)
          .collection('actions')
          .doc(id)
          .set(
            {
              reactedUserIds: Service.Firebase.firestore.FieldValue.arrayUnion(sender.id),
            },
            { merge: true },
          )
      }
    }
  }
  res.status(200).send(true)
})
