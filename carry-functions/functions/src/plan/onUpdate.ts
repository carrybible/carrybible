import { add, compareAsc, differenceInDays, differenceInWeeks } from 'date-fns'
import { firestore, logger } from 'firebase-functions'
import { Service } from '../shared'
import { GroupPlan } from '../types/studyPlan'

const db = Service.Firebase.firestore()

export default firestore.document('/groups/{groupId}/plans/{planId}').onUpdate(async (change, context) => {
  const { groupId } = context.params
  if (!change.after.exists) {
    return Promise.resolve()
  }
  if (!change.before.exists) {
    return Promise.resolve()
  }
  const planBefore = change.before.data() as GroupPlan
  const planData = change.after.data() as GroupPlan
  if (planBefore.status !== planData.status && planData.status === 'ended') {
    // Clear group active goal and nextPeriod
    const groupRef = db.doc(`/groups/${groupId}`)
    const groupData = (await (await groupRef.get()).data()) as Carry.Group

    let blockIndex: number
    // Get block index
    let today = add(new Date(), { hours: -(groupData.timeZone || 0) })
    today.setHours(0, 0, 0, 0)
    today = add(today, { hours: groupData.timeZone || 0 })

    const startDate = planData.startDate.toDate()
    const periodNo = Math.min(getPeriodNumber(startDate, planData.pace), planData.duration)
    // Start from 1
    if (compareAsc(today, startDate) === -1) blockIndex = 0
    else blockIndex = periodNo

    const messageIds: string[] = []
    planData.blocks.forEach((block, index) => {
      // Only delete date not start yet
      if (index + 1 > blockIndex)
        block.activities.forEach((activity) => {
          if (activity.type === 'question' && activity.messageId) {
            messageIds.push(activity.messageId)
          }
        })
    })
    for (let i = 0; i < messageIds.length; i++) {
      try {
        await Service.Stream.deleteMessage(messageIds[i], true)
        const thread = db.doc(`groups/${planData.targetGroupId}/threads/${messageIds[i]}`)
        if ((await thread.get()).exists) {
          await thread.delete()
        }
      } catch (e) {
        logger.error(
          `Unable to delete Message ${messageIds[i]} of Plan ${planData.id} in Group ${planData.targetGroupId}`,
          e,
        )
      }
    }
  }
  return true
})

function getPeriodNumber(d: Date, duration: string) {
  let result = 0
  if (duration === 'day') {
    result = differenceInDays(new Date(), d) + 1
  } else {
    result = differenceInWeeks(new Date(), d) + 1
  }
  return result
}
