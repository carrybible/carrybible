import ActionSteps from '@dts/actionSteps'
import FollowUp from '@dts/followUp'
import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import collections from '@shared/Firestore/collections'
import StreamIO from '@shared/StreamIO'
import { addDays } from 'date-fns'

type ResponseType<T = void> =
  | {
      success: false
      message: string
    }
  | { success: true; data?: T }

function getGroupRef(id: string) {
  return firestore().collection(collections.GROUPS).doc(id)
}

function actionStepsRef(groupId: string, actionStepsId: string) {
  return getGroupRef(groupId).collection(collections.ACTION_STEPS).doc(actionStepsId)
}

async function getActionSteps(
  groupId: string,
  lastVisible: ActionSteps | null,
  { limit, orderBy }: { limit: number; orderBy: string },
): Promise<ActionSteps[]> {
  let groupRef = getGroupRef(groupId).collection(collections.ACTION_STEPS).orderBy(orderBy, 'desc').limit(limit)
  if (lastVisible) {
    groupRef = groupRef.startAfter(lastVisible.updated)
  }
  const actionStepsDocs = (await groupRef.get()).docs
  const actionSteps = actionStepsDocs.map(doc => doc.data() as ActionSteps)

  const requestUnread = functions().httpsCallable('func_get_unread_action_step')
  const data = await requestUnread({
    ids: actionSteps.map(step => ({
      groupId,
      actionStepId: step.id,
    })),
  })
  const {
    response: {
      data: { unread: unreadList },
    },
  } = data.data as {
    response: {
      data: {
        unread: {
          groupId: string
          actionStepId: string
          count: number
        }[]
      }
    }
  }

  return actionSteps.map((step, index) => ({
    ...step,
    unreadCount: unreadList[index].count,
  }))
}

async function createFollowUp(groupId: string, actionStepsId: string, data: FollowUp): Promise<ResponseType> {
  const user = firebase.auth().currentUser
  if (!user) {
    return { success: false, message: 'User not found!' }
  }
  const stepRef = actionStepsRef(groupId, actionStepsId)
  const followUpRef = stepRef.collection(collections.FOLLOW_UPS).doc(data.id)
  await followUpRef.set({ ...data, viewers: [user.uid] }, { merge: true })
  return { success: true }
}

async function getFollowUps(
  groupId: string,
  actionStepsId: string,
  lastVisible: FollowUp | null,
  { limit, orderBy }: { limit: number; orderBy: string },
): Promise<Array<FollowUp>> {
  let followUpsRef = actionStepsRef(groupId, actionStepsId).collection(collections.FOLLOW_UPS).orderBy(orderBy, 'desc').limit(limit)
  if (lastVisible) followUpsRef = followUpsRef.startAfter(lastVisible.updated)
  const actionStepsDocs = (await followUpsRef.get()).docs
  return actionStepsDocs.map(doc => doc.data()) as Array<FollowUp>
}

async function updateFollowUpViewer(groupId: string, actionStepsId: string, followUpId: string) {
  try {
    const user = firebase.auth().currentUser
    if (!user || !groupId || !actionStepsId || !followUpId) {
      return null
    }

    const followUpRef = actionStepsRef(groupId, actionStepsId).collection(collections.FOLLOW_UPS).doc(followUpId)
    await followUpRef.set({ viewers: firebase.firestore.FieldValue.arrayUnion(user.uid) }, { merge: true })
    return { success: true, message: 'Updated viewers of follow up' }
  } catch (error) {
    return { success: false, message: 'Updated viewers of follow up fail' }
  }
}

async function updateAllFollowUpViewer(groupId: string, actionStepsId: string, followUpIds: Array<string>) {
  try {
    const user = firebase.auth().currentUser
    if (!user || !groupId || !actionStepsId || !followUpIds) {
      return null
    }
    const batch = firestore().batch()
    const stepRef = actionStepsRef(groupId, actionStepsId)
    followUpIds.forEach(followUpId => {
      const followUpRef = stepRef.collection(collections.FOLLOW_UPS).doc(followUpId)
      batch.set(
        followUpRef,
        {
          viewers: firebase.firestore.FieldValue.arrayUnion(user.uid),
        },
        { merge: true },
      )
    })

    await batch.commit()
    return { success: true, message: 'Updated viewers of follow up' }
  } catch (error) {
    return { success: false, message: 'Updated viewers of follow up fail' }
  }
}

async function getActiveActionStep(groupId: string) {
  const user = firebase.auth().currentUser
  if (!user) {
    return null
  }

  try {
    const actionStepRef = firestore().collection(collections.GROUPS).doc(groupId).collection(collections.ACTION_STEPS)
    // Remember to create a composite index
    const activeActionStepRes = await actionStepRef
      .where('toDate', '>', firestore.Timestamp.fromMillis(Date.now()))
      .where('status', '==', 'active')
      .get()
    if (activeActionStepRes.empty) {
      return null
    }

    const activeActionStep = activeActionStepRes.docs[0].data()
    return activeActionStep
  } catch (e) {
    console.error(e)
    return null
  }
}

async function getFollowUpForDailyFlow(groupId: string, actionStepId: string): Promise<FollowUp | null> {
  const user = firebase.auth().currentUser
  if (!user) {
    return null
  }

  const stepRef = actionStepsRef(groupId, actionStepId)
  const unreadSnap = await stepRef.collection(collections.UNREAD_COUNT).doc(user.uid).get()
  const unreadCount = unreadSnap.data() as {
    count: number
    unreadFollowUps: string[]
  }
  if (!unreadCount || !unreadCount.unreadFollowUps?.length || unreadCount.unreadFollowUps.length === 0) {
    return null
  }

  const followUpWithMessageCountList = await Promise.all(
    unreadCount.unreadFollowUps.slice(0, 20).map(async followUpId => {
      const channel = StreamIO.client.channel('messaging', followUpId)
      const state = await channel.watch()
      await channel.stopWatching()
      return {
        messageCount: state.messages.length,
        followUpId,
      }
    }),
  )
  const selectedFollowUpId = followUpWithMessageCountList.sort((itemA, itemB) => {
    return itemA.messageCount - itemB.messageCount
  })[0]

  const followUpSnap = await stepRef.collection(collections.FOLLOW_UPS).doc(selectedFollowUpId.followUpId).get()
  const followUp = followUpSnap.data() as FollowUp
  if (!followUp) {
    return null
  }
  return followUp
}

async function createActionStep({
  groupId,
  duration,
  actionText,
}: {
  groupId: string
  duration: number // days
  actionText: string
}) {
  const groupRef = getGroupRef(groupId)
  const actionStepRef = groupRef.collection(collections.ACTION_STEPS)
  const activeActionStepRes = await actionStepRef.where('status', '==', 'active').get()
  await Promise.all(
    activeActionStepRes.docs.map(doc => {
      return doc.ref.set(
        {
          status: 'expired',
        },
        { merge: true },
      )
    }),
  )
  const actionStep = await groupRef.collection(collections.ACTION_STEPS).add({})
  const now = Date.now()
  const serverTimeNow = firestore.Timestamp.fromMillis(now)
  const serverToDate = firestore.Timestamp.fromMillis(addDays(now, duration).getTime())
  await actionStep.set({
    id: actionStep.id,
    actionTextId: actionStep.id,
    actionText,
    status: 'active',
    completedMembers: [],
    fromDate: serverTimeNow,
    toDate: serverToDate,
    updated: serverTimeNow,
    created: serverTimeNow,
  } as ActionSteps)
}

async function markAsComplete({ actionStepId, groupId }: { actionStepId: string; groupId: string }) {
  const user = firebase.auth().currentUser
  if (!user) {
    return
  }

  const stepRef = actionStepsRef(groupId, actionStepId)
  await stepRef.update({
    completedMembers: firestore.FieldValue.arrayUnion(user.uid),
  })
}

export default {
  getActionSteps,
  createFollowUp,
  getFollowUps,
  updateFollowUpViewer,
  getActiveActionStep,
  createActionStep,
  updateAllFollowUpViewer,
  markAsComplete,
  getFollowUpForDailyFlow,
}
