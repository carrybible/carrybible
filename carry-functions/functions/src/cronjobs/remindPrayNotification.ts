import { isYesterday, parseISO, sub } from 'date-fns'
import * as functions from 'firebase-functions'
import { Service } from '../shared'
import { genTran } from '../shared/i18n'
import { EVENTS } from './tasks/types'
import Worker from './tasks/workers'

const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '1GB',
}

const db = Service.Firebase.firestore()

const notify = async () => {
  const premiumGroups = await db.collection('groups').where('subscription.active', '==', true).get()
  const affiliatedGroups = await db.collection('groups').where('organisation.id', '!=', '').get()
  const reducePremiumGroups = await Promise.all(
    premiumGroups.docs.map(async (premiumGroupSnap) => {
      const premiumGroup = premiumGroupSnap.data() as Carry.Group
      return premiumGroup
    }),
  )
  const reduceAffiliatedGroups = await Promise.all(
    affiliatedGroups.docs.map(async (affiliatedGroupSnap) => {
      const affiliatedGroup = affiliatedGroupSnap.data() as Carry.Group
      if (affiliatedGroup?.organisation?.id) {
        const organiseInfoRef = db.collection('organisations').doc(affiliatedGroup.organisation.id)
        const organiseInfo = await (await organiseInfoRef.get()).data()

        if (organiseInfo?.subscription?.active) {
          return affiliatedGroup
        }
      }

      return null
    }),
  )
  const groups = [...reducePremiumGroups, ...reduceAffiliatedGroups]
  if (groups.length === 0) {
    return
  }
  const now = new Date()
  await Promise.all(
    groups.map(async (groupSnap) => {
      const group = groupSnap as Carry.Group

      let currentGroupTime = sub(now, { hours: group?.timeZone || 0 })
      const currentGroupHour = currentGroupTime.getHours()
      if (currentGroupHour === 9) {
        // 9AM
        const channel = Service.Stream.channel('messaging', group.id)
        const memberInfos = (await channel.queryMembers({}))?.members
        for (let i = 0; i < memberInfos.length; i += 1) {
          const memberInfo = memberInfos[i]
          if (memberInfo?.created_at && isYesterday(parseISO(memberInfo.created_at))) {
            if (memberInfo.user_id)
              Worker.createOneTimeWorker(
                memberInfo.user_id,
                new Date(),
                {
                  title: genTran(group.name, { pure: true }),
                  body: genTran('text.what-you-like-prayer-for'),
                  event: EVENTS.remind_pray,
                },
                {
                  groupId: group.id,
                },
              )
          }
        }
      }

      return null
    }),
  )
}

const remindPrayNotification = functions
  .runWith(runtimeOpts)
  .pubsub.schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(notify)

export default remindPrayNotification
