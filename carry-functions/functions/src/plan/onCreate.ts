import { add } from 'date-fns'
import { firestore, logger } from 'firebase-functions'
import { EVENTS } from '../cronjobs/tasks/types'
import Worker from '../cronjobs/tasks/workers'
import { Service } from '../shared'
import { genTran } from '../shared/i18n'
import { GroupPlan } from '../types/studyPlan'

const db = Service.Firebase.firestore()

export default firestore.document('/groups/{groupId}/plans/{planId}').onCreate(async (snap, context) => {
  const { groupId, planId } = context.params

  const plan = snap.data() as GroupPlan
  if (plan.migrate) return

  if (!plan.id || !plan.startDate) {
    return
  }

  try {
    const groupSnap = await db.doc(`/groups/${groupId}`).get()
    const group = groupSnap.data() as Carry.Group

    let startDateValue = add(plan.startDate.toDate(), { hours: -(group.timeZone || 0) })
    startDateValue.setHours(0, 0, 0, 0)
    startDateValue = add(startDateValue, { hours: group.timeZone || 0 })

    let memberToSendNoti = group.members
    if (group.muteMembers) {
      memberToSendNoti = group.members.filter((m) => !group.muteMembers?.includes(m))
    }

    const pace = plan.pace

    const startDate = plan.startDate.toDate()
    const now = new Date()

    if (
      startDate.getFullYear() === now.getFullYear() &&
      startDate.getDate() === now.getDate() &&
      startDate.getMonth() === now.getMonth()
    ) {
      memberToSendNoti.forEach((uid) => {
        Worker.createOneTimeWorker(
          uid,
          new Date(),
          {
            title: genTran(''), // App name
            body: genTran('text.plan-started', {
              valPace: genTran(`text.${pace}`),
              valName: plan.blocks[0].name,
            }),
            event: EVENTS.complete_goal,
          },
          {
            groupId: group.id,
            planId: plan.id,
          },
        )
      })
    }
    return Promise.resolve()
  } catch (error) {
    logger.error(`Error on update messageId for Plan ${planId} of Group ${groupId}`, error)
  }
})
