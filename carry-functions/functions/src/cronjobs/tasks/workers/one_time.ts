import { QueryDocumentSnapshot } from 'firebase-functions/v1/firestore'
import { identity, pick, pickBy } from 'lodash'
import { Service, Utils } from '../../../shared'
import { genTran, TransString } from '../../../shared/i18n'
import { EVENTS, WorkerType } from '../types'
import { GroupActions, GroupActionsType } from '../../../types/groupAction'
import { sub } from 'date-fns'
import { Timestamp } from "firebase-admin/firestore";

const db = Service.Firebase.firestore()

interface OneTimeWorkerType extends WorkerType {
  data: {
    title: TransString
    body?: TransString
    event?: string
  }
  customData?: any
}

const defaultHandler = async (
  uid: string,
  data: OneTimeWorkerType['data'],
  customData: OneTimeWorkerType['customData'],
) => {
  return await Utils.sendNotificationToUser(uid, {
    notification: pick(data, ['title', 'body']),
    data: {
      ...(customData || {}),
      event: data.event,
    },
  })
}

const groupActionCreateHandler = async ({
  groupActionType,
  groupId,
  actionId,
  uid,
  title,
}: {
  groupActionType: GroupActionsType
  groupId: string
  actionId: string
  uid: string
  title: TransString
}) => {
  const beginningOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const checkDate = Timestamp.fromDate(sub(beginningOfToday, { days: 7 }))
  const groupActionsSnap = await db
    .collection(`/groups/${groupId}/actions`)
    .where('created', '>', checkDate)
    .limit(100)
    .orderBy('created', 'desc')
    .get()

  const newGroupActionCreatorSet = new Set<string>()
  groupActionsSnap.forEach((doc) => {
    const data = doc.data() as GroupActions
    if (data.type === groupActionType && !data.viewerIds.includes(uid)) {
      newGroupActionCreatorSet.add(data.creator)
    }
  })
  const newGroupActionCreators = [...newGroupActionCreatorSet]
  if (newGroupActionCreators.length === 0) {
    return
  }

  const [firstCreatorUid, secondCreatorUid] = newGroupActionCreators
  const [firstCreator, secondCreator] = await Promise.all(
    [firstCreatorUid, secondCreatorUid].filter(Boolean).map(async (creatorUid) => {
      const userRef = await db.doc(`/users/${creatorUid}`).get()
      const creator = userRef.data() as Carry.User
      return creator
    }),
  )
  let body: TransString | undefined = undefined
  if (newGroupActionCreators.length === 1 && firstCreator) {
    body = genTran(groupActionType === 'prayer' ? 'text.new-prayer-1' : 'text.new-gratitude-1', {
      authorName1: firstCreator.name,
    })
  }
  if (newGroupActionCreators.length === 2 && firstCreator && secondCreator) {
    body = genTran(groupActionType === 'prayer' ? 'text.new-prayer-2' : 'text.new-gratitude-2', {
      authorName1: firstCreator.name,
      authorName2: secondCreator.name,
    })
  }
  if (newGroupActionCreators.length > 2 && firstCreator && secondCreator) {
    body = genTran(groupActionType === 'prayer' ? 'text.new-prayer-3' : 'text.new-gratitude-3', {
      authorName1: firstCreator.name,
      authorName2: secondCreator.name,
      totalUnreadValue: newGroupActionCreators.length - 2,
    })
  }

  console.log(body)

  if (!body) {
    return
  }

  await Utils.sendCollapsibleNotificationToUser(uid, groupActionType, {
    notification: {
      title,
      body,
    },
    data: {
      groupId,
      actionId,
      groupActionType,
      event: EVENTS.group_action_created,
    },
  })
}

const oneTimeWorker = async (snapshot: QueryDocumentSnapshot, worker: OneTimeWorkerType) => {
  const { data, uid, customData } = worker
  try {
    const { event } = data
    if (event === EVENTS.group_action_created) {
      await groupActionCreateHandler({
        uid,
        groupActionType: customData.groupActionType,
        groupId: customData.groupId,
        actionId: customData.actionId,
        title: data.title,
      })
    } else {
      await defaultHandler(uid, data, customData)
    }
    return snapshot.ref.update({ status: 'complete' })
  } catch (err: any) {
    return await snapshot.ref.update({ status: 'error', errorMessages: [err?.message] })
  }
}

export const createOneTimeWorker = (
  uid: string,
  performAt: Date,
  data: { title?: TransString; body?: TransString; event?: string },
  customData?: any,
) => {
  if (!uid) return
  return db.collection('tasks').add({
    uid,
    worker: 'one_time',
    status: 'scheduled',
    performAt: Service.Firebase.firestore.Timestamp.fromDate(performAt),
    data: pickBy(data, identity),
    ...(customData ? { customData } : {}),
  } as OneTimeWorkerType)
}

export default oneTimeWorker
