/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import firebase from '@react-native-firebase/app'
import functions from '@react-native-firebase/functions'
import firestore from '@react-native-firebase/firestore'
import collections from './collections'
import Constants from '../Constants'

function newAdvancedDraft(groupId: string) {
  return firestore().collection(`${collections.GROUPS}/${groupId}/${collections.DRAFTS}`).doc()
}

function draftRef(groupId: string, goalId: string) {
  return firestore().collection(`${collections.GROUPS}/${groupId}/${collections.DRAFTS}`).doc(goalId)
}

function goalCollectionref(groupId?: string) {
  if (!groupId) return undefined
  return firestore().collection(`${collections.GROUPS}/${groupId}/${collections.DRAFTS}`)
}

const deleteGoal = async (data: { groupId: string; goalId: string }) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined

  const goal = draftRef(data.groupId, data.goalId)
  await goal?.delete()
}

const changeNotStartedGoalStartDate = async (data: { groupId: string; goalId: string; startDate: Date }) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined

  const goal = draftRef(data.groupId, data.goalId)
  await goal?.update({
    startDate: data.startDate,
  })
}

const updateParticipants = async (groupId: string, goalId: string, participants: any) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined

  const ref = draftRef(groupId, goalId)
  await ref.set(
    {
      participants: participants,
    },
    { merge: true },
  )
  return true
}

const endGoal = async (groupId: string, goalId: string) => {
  //Unknown
  const user = firebase.auth().currentUser
  if (!user || groupId == 'undefined') return undefined
  const request = functions().httpsCallable('func_end_goal')
  const { data } = await request({
    groupId: groupId,
    goalId: goalId,
  })
  if (data.success) global.Analytics.event(Constants.EVENTS.GOAL.ENDED_GOAL)
}

const createDraftAdvanceGoal = async (props: {
  periodType: 'day' | 'week'
  groupId: string
}): Promise<
  | {
      success: boolean
      message?: string
      data?: App.AdvancedGoal
    }
  | undefined
> => {
  const user = firebase.auth().currentUser
  if (!user) return undefined

  try {
    const date = new Date()
    const offsetInHours = date.getTimezoneOffset() / 60

    const ref = newAdvancedDraft(props.groupId)

    const advancedGoalData: App.AdvancedGoal = {
      id: ref.id,
      currentPeriod: 0,
      totalPeriod: 0,
      pace: props.periodType,
      title: '',
      blocks: [],
      participants: {},
      studyType: 'advanced',
      status: 'draft',
      owner: { userId: user.uid, timeZone: offsetInHours },
      created: date.getTime(),
      updated: date.getTime(),
      groupId: props.groupId,
    }

    await ref.set(advancedGoalData)
    return { success: true, data: advancedGoalData }
  } catch (e) {
    devWarn('CREATE ADV GOAL FAIL', e)
    return { success: false, message: 'Can not create\nadvanced goal!' }
  }
}

async function updateDraft(draftStudy: App.AdvancedGoal) {
  const user = firebase.auth().currentUser
  const groupId = draftStudy.groupId
  const id = draftStudy.id
  if (!user || !groupId || !id) return undefined
  try {
    const ref = draftRef(groupId, id)
    await ref.set({ ...draftStudy, updated: firestore.FieldValue.serverTimestamp() }, { merge: true })
    return true
  } catch (e) {
    devWarn('Error at update draft', e)
    return false
  }
}

async function deleteDraft(groupId: string, id: string) {
  const user = firebase.auth().currentUser
  if (!user || !groupId || !id) return undefined
  try {
    const ref = draftRef(groupId, id)
    return await ref.delete()
  } catch (e) {
    devWarn('Error at update draft', e)
    return false
  }
}

export default {
  collectionRef: goalCollectionref,
  draftRef,
  deleteGoal,
  changeNotStartedGoalStartDate,
  updateParticipants,
  endGoal,
  createDraftAdvanceGoal,
  updateDraft,
  deleteDraft,
}
