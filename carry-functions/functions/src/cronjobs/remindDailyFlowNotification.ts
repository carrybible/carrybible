import { isBefore, isEqual, isYesterday, parseISO, sub } from 'date-fns'
import isAfter from 'date-fns/isAfter'
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
  const reduceGroups = await Promise.all(
    groups.docs.map(async (group) => {
      const g = group.data() as Carry.Group
      return g
    }),
  )

  if (reduceGroups.length === 0) {
    return
  }
  const now = new Date()
  await Promise.all(
    reduceGroups.map(async (group) => {
      if (!group.activeGoal) return
      const activeGoalStartDate = group.activeGoal?.startDate?.toDate()
      const activeGoalEndDate = group.activeGoal?.endDate?.toDate()
      let isGoalActive = false
      if (activeGoalStartDate && activeGoalEndDate) {
        isGoalActive =
          (isAfter(now, activeGoalStartDate) || isEqual(now, activeGoalStartDate)) && isBefore(now, activeGoalEndDate)
      }

      if (!isGoalActive) return
      const currentGroupTime = sub(now, { hours: group?.timeZone || 0 })
      const currentGroupHour = currentGroupTime.getHours()
      if (currentGroupHour === 12) {
        // 12AM
        const currentGroupPlan = db.collection('groups').doc(group.id).collection('plans').doc(group.activeGoal?.id)
        const currentGroupPlanInfo = (await currentGroupPlan.get()).data() as GroupPlan
        const activeBlockIndex = Utils.getBlockIndexOfPlan(currentGroupPlanInfo)
        const channel = await Service.Stream.channel('messaging', group.id)
        const memberInfos = (await channel.queryMembers({}))?.members
        for (let i = 0; i < memberInfos.length; i += 1) {
          const memberInfo = memberInfos[i]
          if (
            activeBlockIndex <= 2 ||
            currentGroupPlanInfo.blocks[activeBlockIndex - 1].completedMembers?.includes(memberInfo.user_id || '') ||
            currentGroupPlanInfo.blocks[activeBlockIndex - 2].completedMembers?.includes(memberInfo.user_id || '')
          ) {
            continue
          }

          if (memberInfo?.created_at && isYesterday(parseISO(memberInfo.created_at))) {
            if (memberInfo.user_id)
              Worker.createOneTimeWorker(
                memberInfo.user_id,
                new Date(),
                {
                  title: genTran(group.name, { pure: true }),
                  body: genTran('text.take-3-minutes-to-complete'),
                  event: EVENTS.remind_daily_flow,
                },
                {
                  groupId: group.id,
                  planId: currentGroupPlanInfo.id,
                },
              )
          }
        }
      }

      return null
    }),
  )
}

const remindDailyFlowNotification = functions
  .runWith(runtimeOpts)
  .pubsub.schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(notify)

export default remindDailyFlowNotification
