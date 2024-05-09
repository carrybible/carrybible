import { isYesterday, sub } from 'date-fns'

import * as functions from 'firebase-functions'
import { Service, Utils } from '../shared'
import { genTran } from '../shared/i18n'
import { GroupPlan } from '../types/studyPlan'
import { EVENTS } from './tasks/types'
import Worker from './tasks/workers'

const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '1GB',
}

const db = Service.Firebase.firestore()

const notify = async () => {
  const groups = await db.collection('groups').get()

  if (groups.docs.length === 0) {
    return
  }
  const now = new Date()
  await Promise.all(
    groups.docs.map(async (doc) => {
      const group = doc.data() as Carry.Group
      if (!group.hasActionStepFeature) return

      const currentGroupTime = sub(now, { hours: group?.timeZone || 0 })
      const currentGroupHour = currentGroupTime.getHours()
      if (currentGroupHour === 8) {
        const actionStepsSnapshot = await db.collection('groups').doc(group.id).collection('actionSteps').get()
        const actionsSteps = await Promise.all(
          actionStepsSnapshot.docs.map(async (actionStep) => {
            const s = actionStep.data() as Carry.ActionStep
            return s
          }),
        )
        const activeStepIndex = actionsSteps.findIndex((i) => i.status === 'active')

        if (activeStepIndex === -1) return
        const activeStep = actionsSteps[activeStepIndex]
        if (isYesterday(sub(activeStep.fromDate?.toDate?.(), { hours: group?.timeZone || 0 }))) {
          const currentGroupPlan = db
            .collection('groups')
            .doc(group.id)
            .collection('plans')
            .doc(group.activeGoal?.id || '')
          const currentGroupPlanInfo = (await currentGroupPlan.get()).data() as GroupPlan
          const activeBlockIndex = Utils.getBlockIndexOfPlan(currentGroupPlanInfo)
          if (!activeBlockIndex) return
          const notCompletedMembers = group.members.filter(
            (m) =>
              !activeStep.completedMembers.includes(m) &&
              !currentGroupPlanInfo.blocks[activeBlockIndex - 1].completedMembers?.includes(m),
          )
          notCompletedMembers.forEach((uid) => {
            Worker.createOneTimeWorker(
              uid,
              new Date(),
              {
                title: genTran(group.name),
                body: genTran(`text.checkout-today`),
                event: EVENTS.remind_daily_flow,
              },
              {
                groupId: group.id,
                planId: currentGroupPlanInfo.id,
              },
            )
          })
        }
      }

      return null
    }),
  )
}

const remindActionStep = functions.runWith(runtimeOpts).pubsub.schedule('every 1 hours').timeZone('UTC').onRun(notify)

export default remindActionStep
