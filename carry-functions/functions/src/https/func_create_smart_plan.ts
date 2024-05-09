import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import {
  SmartActionsAct,
  SmartBlock,
  SmartPassageAct,
  SmartPlan,
  SmartTextAct,
  SmartVideoAct,
} from '../types/smartPlan'

const SUNDAY = 0,
  SATURDAY = 6

const onCreateSmartPlan = https.onCall(
  async (
    {
      questionIDs,
      groupId,
      startDate,
      organisationId,
    }: { questionIDs?: { [questionKey: string]: string }; groupId?: string; startDate: number; organisationId: string },
    context,
  ) => {
    const uid = context?.auth?.uid || ''
    let success = false
    let message = ''
    let data = {}
    //let questions: { [questionKey: string]: string } | undefined = questionIDs
    let orgId = organisationId || ''
    let previousPlans: string[] = []
    let futurePlans: string[] = []
    let queuedPlans: string[] = []
    const start = new Date(startDate)

    try {
      if (groupId) {
        const groupRef = firestore().collection('groups').doc(groupId)
        const groupData = (await groupRef.get()).data() as Carry.Group
        if (groupData.previousPlans) {
          previousPlans = groupData.previousPlans || []
        }
        if (groupData.queuedPlans) {
          queuedPlans = groupData.queuedPlans || []
        }
      }

      let foundPlan = false
      let smartPlan!: SmartPlan

      let queryRef: FirebaseFirestore.Query = firestore()
        .collection('/smartPlans')
        .where('published', '==', true)
        .orderBy('score', 'desc')

      if (orgId !== '') {
        queryRef = queryRef.where('orgId', '==', orgId)
      } else {
        queryRef = queryRef.where('orgSpecific', '==', false)
      }

      let smartDocs = (await queryRef.get()).docs
      let filteredDocs = smartDocs.filter(filterUsedPlans(previousPlans, futurePlans))

      if (filteredDocs.length > 0) {
        if (queuedPlans.length > 0) {
          for (let queuedPlanId of queuedPlans) {
            let filterQueuedDocs = filteredDocs.filter(filterQueuedPlans(queuedPlanId))
            if (filterQueuedDocs.length > 0) {
              smartPlan = filterQueuedDocs[0].data() as SmartPlan
              foundPlan = true
              const groupRef = firestore().collection('groups').doc(groupId!)
              await groupRef.set({ queuedPlans: firestore.FieldValue.arrayRemove(smartPlan.id) }, { merge: true })
              break
            }
          }
        }
        if (!foundPlan) {
          smartPlan = filteredDocs[0].data() as SmartPlan // pick the one with the highest score
          foundPlan = true
        }
      }

      if (!foundPlan) {
        throw new Error('Cannot find a plan')
      } else {
        if (smartPlan.supportsWeekends) smartPlan.blocks = reorderPlanBlocks(smartPlan.blocks, start)

        // Create study base on smartPlans
        const studyPlan: any = {
          ...smartPlan,
          name: smartPlan.name || '',
          description: smartPlan.description || '',
          pace: smartPlan.pace || '',
          duration: smartPlan?.blocks?.length || 0,
          author: uid,
          owner: uid,
          state: 'completed',
          storeVisible: false,
          version: 1,
          type: 'advanced',
          blocks: (smartPlan?.blocks || []).map((sBlock) => {
            const block = {
              name: sBlock.name,
              activities: sBlock.activities.map((sAct: any) => {
                if (sAct?.type === 'question') {
                  // Question
                  return {
                    type: 'question',
                    question: sAct.question,
                  }
                } else if (sAct?.type === 'video') {
                  // Video
                  const act = sAct as SmartVideoAct
                  return {
                    type: 'video',
                    title: act.title,
                    description: act.description,
                    service: act.service,
                    videoId: act.videoId,
                    duration: act.duration,
                  }
                } else if (sAct?.type === 'passage') {
                  // Passage
                  const act = sAct as SmartPassageAct
                  return {
                    type: 'passage',
                    chapter: {
                      bookId: act.bookId,
                      bookName: act.bookName,
                      bookAbbr: act.bookAbbr,
                      chapterId: act.chapterId,
                      chapterNumber: act.chapterId,
                      toChapterId: act.toChapterId,
                      toChapterNumber: act.toChapterId,
                    },
                    verseRange: act.verses
                      ? act.verses
                          .map((verse) => {
                            if (verse.from === verse.to) return String(verse.from)
                            else return `${verse.from} - ${verse.to}`
                          })
                          .join(', ')
                      : '',
                    verses: act.verses,
                  }
                } else if (sAct?.type === 'action') {
                  // Actions
                  const act = sAct as SmartActionsAct
                  return {
                    type: 'action',
                    actionType: act.actionType,
                    text: act.text,
                  }
                } else if (sAct?.type === 'text') {
                  const act = sAct as SmartTextAct
                  return {
                    type: 'text',
                    content: act.content,
                  }
                } else {
                  return sAct
                }
              }),
            }
            logger.log(block)
            return block
          }),
          targetGroupId: '',
          status: 'normal',
        }

        success = true
        message = `Successfully create plan structure for group`
        data = studyPlan
      }
    } catch (e: any) {
      message = `Cannot create plan structure for group, ${e.message}`
      success = false
      logger.error(message)
    }

    logger.info(message)
    return { success, message, data }
  },
)

/** checks if plans been used */
function filterUsedPlans(previousPlans: string[], futurePlans: string[]) {
  return function (smartPlanSnap: firestore.QueryDocumentSnapshot<firestore.DocumentData>) {
    let smartPlan = smartPlanSnap.data() as SmartPlan
    return !previousPlans.includes(smartPlan.id) && !futurePlans.includes(smartPlan.id)
  }
}

/** checks if plans have been queued */
function filterQueuedPlans(queuedPlanId: string) {
  return function (smartPlanSnap: firestore.QueryDocumentSnapshot<firestore.DocumentData>) {
    let smartPlan = smartPlanSnap.data() as SmartPlan
    return queuedPlanId === smartPlan.id
  }
}

/** Reorders the days of the Smart Plan to account for weekends  */
function reorderPlanBlocks(smartPlanBlocks: SmartBlock[], startDate: Date): SmartBlock[] {
  let resultBlocks: SmartBlock[] = new Array(smartPlanBlocks.length)
  let weekdays: SmartBlock[] = []
  let weekends: SmartBlock[] = []

  for (const block of smartPlanBlocks) {
    if (block.type == 'weekday') {
      weekdays.push(block)
    } else if (block.type == 'weekend') {
      weekends.push(block)
    } else {
      logger.error('Unexpected block type')
    }
  }

  let day = startDate.getDay()

  for (let i = 0; i < resultBlocks.length; i++) {
    if (day === SATURDAY || day === SUNDAY) {
      let block = weekends.shift()
      if (block === undefined) {
        block = weekdays.shift()!
      }
      resultBlocks[i] = block
    } else if (day > SUNDAY && day < SATURDAY) {
      resultBlocks[i] = weekdays.shift()!
    } else {
      logger.error('Unexpected block type')
    }

    day++
    if (day > SATURDAY) day = SUNDAY
  }

  return resultBlocks
}

export default onCreateSmartPlan
