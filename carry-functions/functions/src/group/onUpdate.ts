import { firestore as firestoreAdmin } from 'firebase-admin'
import { firestore, logger } from 'firebase-functions'
import { isEqual } from 'lodash'
import { EVENTS } from '../cronjobs/tasks/types'
import Worker from '../cronjobs/tasks/workers'
import { Service, Utils } from '../shared'
import { genTran } from '../shared/i18n'
import { onUpdateGroup } from '../shared/reports/syncGroupData'
import collections from '../types/collections'
import { DEFAULT_SCORE } from '../types/score'

const db = Service.Firebase.firestore()

export default firestore.document('/groups/{groupId}').onUpdate(async (change, context) => {
  const { groupId } = context.params
  const nVal = change.after.data() as Carry.Group
  const pVal = change.before.data() as Carry.Group
  await onUpdateGroup(nVal, pVal, change.after.ref)
  if (nVal?.orgSyncStatus !== pVal?.orgSyncStatus) {
    // For trigger sync only
    return
  }
  const groupUpdate: any = {}
  let needsUpdate = false
  const promises = []

  try {
    // change in owner or add new owner
    if (pVal.owner !== nVal.owner && nVal.service === 'StreamIO') {
      if (pVal.owner !== undefined && pVal.owner !== '' && nVal.owner !== undefined && nVal.owner !== '') {
        // change owner
        const channel = Service.Stream.channel('messaging', groupId)
        promises.push(channel.demoteModerators([pVal.owner]))
        promises.push(channel.addModerators([nVal.owner]))
      } else if (nVal.owner !== undefined && nVal.owner !== '') {
        // new owner
        const streamChannel = Service.Stream.channel('messaging', groupId, {
          image: nVal.image,
          name: nVal.name,
          subscription: nVal.subscription,
          organisation: nVal.organisation,
          created_by_id: nVal.owner,
        })

        promises.push(
          streamChannel
            .create()
            .then(() => {
              return streamChannel.addModerators([nVal.owner])
            })
            .then(() => {
              return streamChannel.sendMessage(
                {
                  text: 'Hey! Welcome to the group - checkout this video to learn how to use Carry 🙏 https://youtu.be/cJD-0vWXCUQ',
                  user: { id: nVal.owner },
                  silent: true,
                  skip_push: true,
                },
                { skip_push: true },
              )
            }),
        )

        promises.push(Service.Firebase.firestore().doc(`/groups/${groupId}`).update({ cid: streamChannel.cid }))
      }
    }

    if (pVal.service === 'StreamIO' && nVal.service === 'StreamIO') {
      // Get stream current members
      const groupChannel = Service.Stream.channel('messaging', groupId)
      // We check again to make sure channel only update when it need to
      if (pVal.name !== nVal.name || pVal.image !== nVal.image || !isEqual(pVal.organisation, nVal.organisation)) {
        // Wait 10 seconds before retrying channel update
        promises.push(
          Utils.retry(
            () =>
              groupChannel.update({
                name: nVal.name,
                image: nVal.image,
                subscription: nVal.subscription,
                organisation: nVal.organisation,
              }),
            10000,
          ),
        )
      }

      // Change in basic properties or subscription
      if (nVal.activeGoal && pVal.activeGoal?.id !== nVal.activeGoal?.id && nVal.activeGoal?.startDate) {
        // Update channel if we've made changes
        const startDate = nVal.activeGoal?.startDate?.toDate()
        const parseStartDate = Utils.parseToUserTime(startDate, nVal.timeZone)
        const now = Utils.parseToUserTime(new Date(), nVal.timeZone)
        if (
          parseStartDate.getFullYear() === now.getFullYear() &&
          parseStartDate.getDate() === now.getDate() &&
          parseStartDate.getMonth() === now.getMonth() &&
          nVal.activeGoal.pace &&
          nVal.activeGoal.id
        ) {
          const planDoc = await db
            .collection(collections.GROUPS)
            .doc(groupId)
            .collection(collections.PLANS)
            .doc(nVal.activeGoal.id)
            .get()
          const plan = planDoc.data()
          nVal.members.forEach((uid) => {
            Worker.createOneTimeWorker(
              uid,
              new Date(),
              {
                title: genTran(''), // App name
                body: genTran('text.plan-started', {
                  valPace: genTran(`text.${nVal.activeGoal?.pace || 'day'}`),
                  valName: plan?.blocks?.[0]?.name || '',
                }),
                event: EVENTS.complete_goal,
              },
              {
                groupId: groupId,
                planId: plan?.id,
              },
            )
          })
        }
      }

      // Change in members members
      if (!Utils.stringArrayEquals(nVal.members, pVal.members)) {
        const addedMembers = nVal.members.filter((m) => !pVal.members.includes(m))
        const removedMembers = pVal.members.filter((m) => !nVal.members.includes(m))

        groupUpdate.memberCount = nVal.members.length
        needsUpdate = true

        if (addedMembers.length > 0) {
          // Update member list on streamIo
          promises.push(Utils.retry(() => groupChannel.addMembers(addedMembers)))

          // Initial score for added members
          const batch = db.batch()
          addedMembers.forEach((uid) => {
            batch.set(db.collection('groups').doc(groupId).collection('score').doc(uid), {
              total: DEFAULT_SCORE,
              updated: firestoreAdmin.FieldValue.serverTimestamp(),
            })
          })
          logger.log(`Initialize score for user(s): ${addedMembers} to ${DEFAULT_SCORE}`)
          await batch.commit()

          // Get new user info
          const userPath = db.doc(`/users/${addedMembers[0]}`)
          promises.push(
            userPath.get().then((userSnap) => {
              const userData = userSnap.data() as Carry.User
              let memberToSendNoti = pVal.members
              if (nVal.muteMembers) {
                memberToSendNoti = pVal.members.filter((m) => !nVal.muteMembers?.includes(m))
              }

              // Only sent welcome for group have total members under 5
              if (pVal.members.length <= 5) {
                memberToSendNoti.forEach((uid) => {
                  promises.push(
                    Utils.sendNotificationToUser(uid, {
                      notification: {
                        title: genTran(nVal.name, { pure: true }), // App name
                        body: genTran('text.say-hi-new-member', {
                          valName: genTran(userData.name || 'text.new-member'),
                        }),
                      },
                      data: {
                        groupId: groupId,
                        event: EVENTS.joined_group,
                      },
                    }),
                  )
                })
              }
              // Send welcome to new member
              promises.push(
                Utils.sendNotificationToUser(userData.uid, {
                  notification: {
                    title: genTran('text.welcome', {
                      valName: userData.name,
                    }),
                    body: genTran('text.welcome-to', {
                      valName: nVal.name,
                    }),
                  },
                  data: {
                    groupId: groupId,
                    event: EVENTS.joined_group,
                  },
                }),
              )
              /**
               * TO-DO:
               * Send notification to owner (or Leaders when apply logic multiple leaders in one group)
               * */
              return Promise.resolve([])
            }),
          )
        }

        // Stop send notification here, update in func_remove_group_member
        if (removedMembers.length > 0) {
          //   let firstName = ''

          //   for (let uid of removedMembers) {
          //     const userRef = db.doc(`/users/${uid}`)
          //     const userData = (await (await userRef.get()).data()) as Carry.User
          //     if (!firstName) {
          //       firstName = userData.name || ''
          //     }
          //     promises.push(
          //       userRef.update({
          //         groups: firestoreAdmin.FieldValue.arrayRemove(groupId),
          //         // For prevent user enter the group in next login
          //         latestJoinedGroup:
          //           userData?.latestJoinedGroup === groupId
          //             ? userData?.groups?.find((value) => value !== groupId) || ''
          //             : userData?.latestJoinedGroup || '',
          //       }),
          //     )

          //     promises.push(
          //       Utils.sendNotificationToUser(uid, {
          //         notification: {
          //           title: genTran(`${nVal.name}`),
          //           body: genTran('text.no-longer-belong', {
          //             valGroup: nVal.name,
          //           }),
          //         },
          //         data: {
          //           groupId: groupId,
          //           event: EVENTS.info,
          //         },
          //       }),
          //     )
          //   }

          //   // Remove member on streamIO
          promises.push(Utils.retry(() => groupChannel.removeMembers(removedMembers)))

          //   // Send notification to group owner
          //   /**
          //    * TO-DO:
          //    * Will be send to leaders array when apply new logic
          //    */
          //   promises.push(
          //     Utils.sendNotificationToUser(nVal.owner, {
          //       notification: {
          //         title: genTran(nVal.name),
          //         body: genTran('text.left-group', {
          //           valName: firstName,
          //           valExtra:
          //             removedMembers.length > 1
          //               ? genTran('text.and-more', {
          //                   valCount: removedMembers.length - 1,
          //                 })
          //               : '',
          //         }),
          //       },
          //       data: {
          //         groupId: groupId,
          //         event: EVENTS.left_group,
          //       },
          //     }),
          //   )
        }
      }
    }
    if (needsUpdate) {
      promises.push(change.after.ref.update(groupUpdate))
    }
  } catch (e) {
    logger.error(`Error updating group ${groupId}:`, e)
  }
  return Promise.all(promises)
})
