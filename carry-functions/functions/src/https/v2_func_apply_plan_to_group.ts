import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { func_trigger_change_active_plan } from '..'
import { Service, Utils } from '../shared'
import collections from '../types/collections'
import { GroupPlan, UserPlan } from '../types/studyPlan'
import { startRemotionRender, Video } from '../video/func_process_video'
import { getYouTubeDirectVideoUrl } from '../video/YouTube'
import { getOverlapPlans } from './func_check_overlap_plans'
import { endStudyPlan } from './func_end_study_plan'

const onCreateGoal = https.onCall(
  async ({ groupId, userPlan, startDate }: { groupId: string; userPlan: UserPlan; startDate: number }, context) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''
    let data = {}

    if (!groupId || !userPlan) {
      message = 'Missing groupId or plan data'
    }

    if (uid && typeof groupId === 'string' && groupId && userPlan) {
      try {
        const groupRef = firestore().doc(`/groups/${groupId}`)
        const group = await groupRef.get()
        const groupData = group.data() as Carry.Group

        const channel = Service.Stream.channel('messaging', groupId)
        const groupPlanRef = firestore().collection('groups').doc(groupId).collection('plans').doc()

        let today = add(new Date(), { hours: -(groupData.timeZone || 0) })
        today.setHours(0, 0, 0, 0)
        today = add(today, { hours: groupData.timeZone || 0 })

        const startThreadDate = new Date(startDate)
        // Set to timezone of user, then set time to 0:00, move back to server time.
        let startDateValue = add(startThreadDate, { hours: -(groupData.timeZone || 0) })
        startDateValue.setHours(0, 0, 0, 0)
        startDateValue = add(startDateValue, { hours: groupData.timeZone || 0 })

        const overlapPlan: { data: GroupPlan[] } = await getOverlapPlans({
          groupId,
          startDate,
          duration: userPlan.duration,
          pace: userPlan.pace,
          context,
        })

        const groupStudyPlan: GroupPlan = {
          ...userPlan,
          id: groupPlanRef.id,
          originalId: userPlan.id || '',
          targetGroupId: groupId,
          status: today < startDateValue ? 'future' : 'normal',
          startDate: firestore.Timestamp.fromDate(startDateValue),
          created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
          updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
          memberProgress: {
            [uid]: {
              uid: uid,
              isCompleted: false,
              percent: 0,
              totalReadingTime: 0,
            },
          },
        }

        // Check activities valid or not
        if (!groupStudyPlan?.blocks || groupStudyPlan.blocks.length === 0) {
          return {
            success: false,
            message: 'Study plan is empty!',
          }
        } else {
          for (let bi = 0; bi < groupStudyPlan.blocks.length; bi++) {
            const bk = groupStudyPlan.blocks[bi]
            if (!bk.activities || bk.activities.length === 0) {
              return {
                success: false,
                message: `Plan for ${groupStudyPlan.pace} ${bi} is empty!`,
              }
            }
          }
        }


        try {
          // if the study plan was created from a YouTube video, generate a group-specific instance of the video for the group+plan
          if (groupStudyPlan.origin === 'video' && groupStudyPlan.planVideoId) {
            const videoRef = firestore().collection('videos').doc(groupStudyPlan.planVideoId)
            const video = (await videoRef.get()).data() as Video
            let videoUrl: string | undefined

            if (video.youTubeVideoTranscribeResultsUrl) {
              videoUrl = video.youTubeVideoTranscribeResultsUrl
            } else {
              videoUrl = await getYouTubeDirectVideoUrl(video.youTubeVideoId)
            }

            if (videoUrl) {
              const codes = (
                await firestore()
                  .collection(collections.CODES)
                  .where('groupId', '==', groupId)
                  .orderBy('created', 'desc')
                  .get()
              ).docs

              const groupInviteCode = codes[0].data().code

              const renderId = await startRemotionRender(
                videoUrl,
                video.youTubeVideoTime || 0,
                groupData.image,
                groupStudyPlan.name,
                groupInviteCode,
                video.planVideoVersion,
                video.fileName,
              )

              const groupVideoRef = firestore().collection('groups').doc(groupId).collection('videos').doc()

              const groupVideo = {
                id: groupVideoRef.id,
                renderId: renderId,
                videoId: video.videoId,
                orgStudyPlanId: userPlan.id,
                groupStudyPlanId: groupStudyPlan.id,
                groupId: groupId,
                groupImage: groupData.image,
                groupName: groupData.name,
                thumbnail: video.youTubeVideoThumbnail,
                studyName: groupStudyPlan.name,
                created: firestore.FieldValue.serverTimestamp(),
              }

              await groupVideoRef.set(groupVideo)

              groupStudyPlan.groupVideoId = groupVideoRef.id

              const renderDoc = {
                renderId: renderId,
                groupId: groupId,
                groupVideoId: groupVideoRef.id,
              }

              await firestore().collection('renders').doc(renderId).create(renderDoc)
            }
          }
        } catch (e: any) {
          message = `Cannot generate video while scheduling plan ${e.message}`
          logger.error(message)
        }

        // Create and apply all channel ID for groupStudy
        const blocks = [...groupStudyPlan.blocks]
        const userInfo = (await firestore().doc(`users/${uid}`).get()).data()

        if (blocks.length > 0) {
          // Update messageId for first block
          const block = groupStudyPlan.blocks[0]
          const activities = []
          for (let i = 0; i < block.activities.length; i++) {
            const activity = block.activities[i]
            if (activity.type === 'question') {
              const messageId = await Utils.sendMessageAndGenerateThread({
                uid,
                channel,
                question: activity.question,
                plan: groupStudyPlan,
                hasAttachment: false,
                startThreadDate: startThreadDate,
                blockIndex: 1,
                user: userInfo,
              })
              activities.push({
                ...activity,
                messageId,
              })
            } else activities.push(activity)
          }
          blocks[0] = {
            ...block,
            activities,
          }
        }

        await groupPlanRef.set({ ...groupStudyPlan, blocks })

        let lastActiveGoal = ''

        if (groupData?.activeGoal) {
          const isOverlapActivePlan = !!overlapPlan.data.find((value) => value.id === groupData?.activeGoal?.id)
          if (isOverlapActivePlan) {
            lastActiveGoal = groupData?.activeGoal.id
            await endStudyPlan(groupId, groupData?.activeGoal.id)
          }
        }

        if (overlapPlan.data.length > 0) {
          for (let i = 0; i < overlapPlan.data.length; i++) {
            const plan = overlapPlan.data[i]
            if (lastActiveGoal !== plan.id) {
              // Don't remove active plan, just end it
              const planRef = firestore().collection('groups').doc(groupId).collection('plans').doc(plan.id)
              await planRef.delete()
            }
          }
        }

        let groupUpdate: any = {
          activeGoal: {
            id: groupPlanRef.id,
            startDate: firestore.Timestamp.fromDate(startDateValue),
            endDate: firestore.Timestamp.fromDate(add(startDateValue, { [`${userPlan.pace}s`]: userPlan.duration })),
            pace: userPlan.pace,
            duration: userPlan.duration,
            name: userPlan.name,
          },
        }

        if (userPlan.id) {
          groupUpdate.previousPlans = firestore.FieldValue.arrayUnion(userPlan.id)
        }

        if (today.getTime() == startDateValue.getTime()) {
          // only update active plan when new plan can replace active plan
          await groupRef.set(groupUpdate, { merge: true })
        }

        // Trigger to get new plan in case future
        await func_trigger_change_active_plan.run({ groupId }, context)

        success = true
        message = `Successfully apply study ${groupStudyPlan.id} in group ${groupId}`
        data = groupStudyPlan
      } catch (e: any) {
        message = `Cannot create new goal for group ${groupId}, ${e.message}`
        success = false
        logger.error(message)
      }
    }
    logger.info(message)
    return { success, message, data }
  },
)

export default onCreateGoal
