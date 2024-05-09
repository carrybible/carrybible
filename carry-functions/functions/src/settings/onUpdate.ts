import * as functions from 'firebase-functions'
// @ts-ignore
import { firestore as firestoreAdmin } from 'firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// @ts-ignore
import { DEFAULT_SCORE, GroupScoreSettingType } from '../types/score'
import { Service } from '../shared'

const db = Service.Firebase.firestore()

export const settings_groupScore_patchData = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .firestore.document('/settings/groupScore')
  .onUpdate(async (change, context) => {
    if (!change.after.exists || !change.before.exists) {
      return
    }
    const pSetting = change.before.data() as GroupScoreSettingType
    const nSetting = change.after.data() as GroupScoreSettingType

    // toggle config from false -> true: trigger patch job
    if (!pSetting.shouldPatchGroupScoreData && nSetting.shouldPatchGroupScoreData) {
      const batch = db.batch()
      const groups = await db.collection('groups').select('members').orderBy('created', 'asc').get()

      const groupIds: { id: string; members: string[] }[] = []
      groups.forEach((group) => {
        const members = group.data().members
        groupIds.push({ id: group.id, members })
      })

      await Promise.all(
        groupIds.map(async ({ id: groupId, members }) => {
          if (members.length === 0) {
            return
          }
          const scoreRef = db.collection('groups').doc(groupId).collection('score')
          const score = await scoreRef.get()
          if (score.size < members.length) {
            functions.logger.log(`Patch data for group ${groupId}, this group has ${members.length} members`)
            members.forEach((uid) => {
              batch.set(
                scoreRef.doc(uid),
                {
                  total: DEFAULT_SCORE,
                  updated: FieldValue.serverTimestamp(),
                },
                {
                  merge: true,
                },
              )
            })
          }
        }),
      )
      await batch.commit()
    }
  })

export const settings_unreadThreads_migrationData = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .firestore.document('/settings/unreadThreads')
  .onUpdate(async (change, context) => {
    if (!change.after.exists || !change.before.exists) {
      return
    }
    const pSetting = change.before.data() as { shouldMigrateUnreadDiscussion: boolean }
    const nSetting = change.after.data() as { shouldMigrateUnreadDiscussion: boolean }

    // toggle config from false -> true: trigger migration job
    if (!pSetting.shouldMigrateUnreadDiscussion && nSetting.shouldMigrateUnreadDiscussion) {
      const groups = await db.collection('groups').select('members').orderBy('created', 'asc').get()
      functions.logger.log(`Total groups: ${groups.size}`)

      const groupIds: { id: string; members: string[] }[] = []
      groups.forEach((group) => {
        const members = group.data().members
        groupIds.push({ id: group.id, members })
      })

      let batchData: { ref: any; data: any }[] = []
      await Promise.all(
        groupIds.map(async ({ id: groupId, members }) => {
          if (members.length === 0) {
            return
          }
          const threadsRef = db.collection('groups').doc(groupId).collection('threads')
          const threads = await threadsRef.where('replyCount', '>', 0).get()
          threads.docs.forEach((threadSnap) => {
            const thread = threadSnap.data() as Carry.Thread
            const viewers = thread.viewers
            const replyCount = thread.replyCount
            if (!viewers || viewers.length === 0) {
              return
            }
            viewers.forEach(({ last_reply_count: lastReplyCount, id: userId }) => {
              if (lastReplyCount < replyCount) {
                functions.logger.log(
                  `Migrate unread thread for user ${userId} in group ${groupId}. Current replyCount is ${replyCount} and user last reply count is ${lastReplyCount}`,
                )
                batchData.push({
                  ref: threadsRef.doc(thread.id).collection('unreadThreads').doc(userId),
                  data: {
                    uid: userId,
                    groupId,
                    threadId: thread.id,
                    planId: thread.planID,
                    threadStartDate: thread.startDate,
                    updated: Timestamp.now(),
                    isUnread: true,
                  } as Carry.UnreadThread,
                })
              }
            })
          })
        }),
      )

      const BATCH_COUNT = 250
      let count = 0
      for (let i = 0; i < batchData.length; i += BATCH_COUNT) {
        const batch = db.batch()
        try {
          batchData.slice(i, i + BATCH_COUNT).forEach(({ ref, data }) => {
            count++
            batch.set(ref, data, { merge: true })
          })
          await batch.commit()
          functions.logger.log(`Already migrated: ${count}. ${batchData.length - count}`)
        } catch (e) {
          console.error(e)
        }
      }
      functions.logger.log(`Total migrated: ${count}`)
    }
  })

export const settings_fixThreadBlockIndex = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .firestore.document('/settings/fixThreadBlockIndex')
  .onUpdate(async (change, context) => {
    if (!change.after.exists || !change.before.exists) {
      return
    }
    const pSetting = change.before.data() as { active: boolean }
    const nSetting = change.after.data() as { active: boolean }

    // toggle config from false -> true: trigger migration job
    if (!pSetting.active && nSetting.active) {
      const groups = await db.collection('groups').get()
      functions.logger.log(`Total groups: ${groups.size}`)

      const threadIds: { threadId: string; groupId: string; blockIndex: number }[] = []

      for (const group of groups.docs) {
        if (group.exists && group.id) {
          const plans = await db.collection('groups').doc(group.id).collection('plans').get()
          for (const plan of plans.docs) {
            const planData = plan.data() as Carry.Plan
            if (planData.blocks) {
              planData.blocks.forEach((block, index) => {
                for (const activity of block.activities || []) {
                  if (activity.type === 'question' && activity.messageId) {
                    threadIds.push({
                      threadId: activity.messageId,
                      groupId: group.id,
                      blockIndex: index + 1,
                    })
                  }
                }
              })
            }
          }
        }
      }

      let batchData: { ref: any; data: any }[] = []
      await Promise.all(
        threadIds.map(async ({ threadId, groupId, blockIndex }) => {
          const threadsRef = db.collection('groups').doc(groupId).collection('threads').doc(threadId)
          batchData.push({
            ref: threadsRef,
            data: {
              blockIndex,
            },
          })
        }),
      )

      const BATCH_COUNT = 250
      let count = 0
      functions.logger.log(`Total threads: ${batchData.length}`)
      for (let i = 0; i < batchData.length; i += BATCH_COUNT) {
        const batch = db.batch()
        try {
          batchData.slice(i, i + BATCH_COUNT).forEach(({ ref, data }) => {
            count++
            batch.set(ref, data, { merge: true })
          })
          await batch.commit()
          functions.logger.log(`Already migrated: ${count}. ${batchData.length - count}`)
        } catch (e) {
          console.error(e)
        }
      }
      functions.logger.log(`Total migrated: ${count}`)
    }
  })
