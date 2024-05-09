import { StudyPlan } from '@dts/study'
import firestore, { firebase, FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import { wait } from '@shared/Utils'
import { isAfter } from 'date-fns'
import { chunk } from 'lodash'
import collections from './collections'

function planCollectionref(groupId?: string) {
  if (!groupId) return undefined
  return firestore().collection(`${collections.GROUPS}/${groupId}/${collections.PLANS}`)
}

function smartPlanRef(smpId?: string) {
  return firestore().collection(`${collections.SMART_PLANS}`).doc(smpId)
}

function getUserPlanByGroupRef(userId: string, groupId: string) {
  return firestore()
    .collection(collections.USERS)
    .doc(userId)
    .collection(collections.PLANS)
    .where('targetGroupId', '==', groupId)
    .where('state', '==', 'draft')
}

function getUserProgressRef(userId: string, groupId: string, planId: string) {
  return firestore()
    .collection(collections.GROUPS)
    .doc(groupId)
    .collection(collections.PLANS)
    .doc(planId)
    .collection(collections.PROGRESS)
    .where('uid', '==', userId)
}

function getGroupPlan(groupId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS)
}

function getUserStudyRef(userId: string, planId: string) {
  return firestore().collection(collections.USERS).doc(userId).collection(collections.PLANS).doc(planId)
}

function newUserStudyRef(userId: string) {
  return firestore().collection(collections.USERS).doc(userId).collection(collections.PLANS).doc()
}

function getUserStudyPlansRef(userId: string) {
  return firestore().collection(collections.USERS).doc(userId).collection(collections.PLANS)
}

function newGroupGoalRef(groupId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS).doc()
}

function getGroupPlanRef(groupId: string, planId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS).doc(planId)
}

function getGroupRef(groupId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId)
}

async function getPlanData(groupId: string, planId: string): Promise<StudyPlan.GroupPlan> {
  const ref = getGroupPlanRef(groupId, planId)
  return (await ref.get()).data() as StudyPlan.GroupPlan
}

export async function createQuickStudy(
  groupId,
  { name, bookId, bookName, bookAbbr, fromChapterId, toChapterId, totalChapter, chapterPerPace, pace, questions, startDate, status },
) {
  const user = firebase.auth().currentUser
  const userId = user?.uid || ''
  try {
    // Create study in User Study Group
    const userStudyRef = newUserStudyRef(userId)
    const blocks: StudyPlan.Block[] = []
    const duration = Math.ceil(totalChapter / chapterPerPace)
    const questionValues = questions.map(value => {
      return {
        question: value,
        type: 'question',
      }
    })
    for (let i = 0; i < duration; i++) {
      const from = fromChapterId + chapterPerPace * i // i * chapterPerPace
      const to = Math.min(fromChapterId + chapterPerPace * (i + 1) - 1, toChapterId) // Math.min((i + 1) * chapterPerPace + fromChapterId - 1, totalChapter)
      const acts: (StudyPlan.QuestionAct | StudyPlan.PassageAct)[] = [
        {
          chapter: {
            bookId,
            bookName: bookName || '',
            bookAbbr: bookAbbr || '',
            chapterId: from,
            chapterNumber: from,
            toChapterId: to,
            toChapterNumber: to,
          },
          type: 'passage',
        },
        ...questionValues,
      ]
      const block: StudyPlan.Block = {
        name: `${bookName} ${from === to ? from : `${from}-${to}`}`,
        activities: acts,
      }
      blocks.push(block)
    }
    const userStudyPlan: StudyPlan.UserPlan = {
      id: userStudyRef.id,
      name: name,
      pace,
      duration,
      author: userId,
      owner: userId,
      state: 'completed',
      type: 'quick',
      storeVisible: false,
      version: 1,
      created: firestore.FieldValue.serverTimestamp(),
      updated: firestore.FieldValue.serverTimestamp(),
      blocks,
      targetGroupId: groupId,
    }
    await userStudyRef.set(userStudyPlan)
    const groupStudyPlan = await applyStudyPlanToGroup(groupId, userStudyPlan, startDate)
    return groupStudyPlan
  } catch (error) {
    devWarn('Error in create quick study', error)
  }
  return false
}

async function createAdvancedStudyDraft(groupId: string, pace: 'day' | 'week'): Promise<StudyPlan.UserPlan | null> {
  const user = firebase.auth().currentUser
  const userId = user?.uid || ''
  try {
    // Create study in User Study Group
    const userStudyRef = newUserStudyRef(userId)

    const userStudyPlan: StudyPlan.UserPlan = {
      id: userStudyRef.id,
      name: '',
      pace,
      duration: 0,
      author: userId,
      owner: userId,
      state: 'draft',
      type: 'advanced',
      storeVisible: false,
      version: 1,
      created: firestore.FieldValue.serverTimestamp(),
      updated: firestore.FieldValue.serverTimestamp(),
      blocks: [],
      targetGroupId: groupId,
    }
    await userStudyRef.set(userStudyPlan)
    devLog('create advanced draft success', userStudyPlan)
    return userStudyPlan
  } catch (error) {
    devWarn('Error in create advanced draft', error)
    return null
  }
}

async function updateAdvancedStudyDraft(data: StudyPlan.UserPlan): Promise<StudyPlan.UserPlan | null> {
  const user = firebase.auth().currentUser
  const userId = user?.uid || ''
  try {
    // Create study in User Study Group
    const userStudyRef = getUserStudyRef(userId, data.id)

    const userStudyPlan = {
      ...data,
      updated: firestore.FieldValue.serverTimestamp(),
    }
    devLog('update userStudyPlan', userStudyPlan)
    await userStudyRef.set(userStudyPlan, { merge: true })
    devLog('update advanced draft success', userStudyPlan)
    return userStudyPlan
  } catch (error) {
    devWarn('Error in update advanced draft', error)
    return null
  }
}

async function deleteUserStudy(draftId: string): Promise<boolean> {
  const user = firebase.auth().currentUser
  const userId = user?.uid || ''
  try {
    const userStudyRef = getUserStudyRef(userId, draftId)
    await userStudyRef.delete()
    console.info('Delete advanced draft success')
    return true
  } catch (error) {
    devWarn('Error in Delete advanced draft', error)
    return false
  }
}

async function applyStudyPlanToGroup(
  groupId: string,
  userPlan: StudyPlan.UserPlan,
  startDate: Date,
): Promise<StudyPlan.GroupPlan | undefined> {
  const request = functions().httpsCallable('v2_func_apply_plan_to_group')
  devLog('v2 applyStudyPlanToGroup', userPlan)
  const response = await request({
    groupId,
    userPlan,
    startDate: startDate.getTime(),
  })
  if (response.data.success) {
    return response.data.data as StudyPlan.GroupPlan
  } else {
    devLog('Error on apply study', response.data.message)
    return undefined
  }
}

async function updateGroupStudyProgress(
  groupId: string,
  planId: string,
  blockIndex: number,
  step: number,
  readingTime: number | undefined,
): Promise<boolean> {
  if (step === 0) {
    devLog('Error on update study progress', '0')
    return false
  }
  const request = functions().httpsCallable('func_update_group_study_progress')
  const date = new Date()
  const offsetInHours = date.getTimezoneOffset() / 60
  const response = await request({
    groupId,
    planId,
    blockIndex,
    step,
    offsetTimezone: offsetInHours,
    ...(readingTime ? { readingTime } : {}),
  })
  if (response.data.success) {
    devLog('Success on update study progress')
    return true
  } else {
    devLog('Error on update study progress', response.data.message)
    return false
  }
}

async function endGroupStudy(groupId: string, studyPlanId: string): Promise<boolean> {
  const request = functions().httpsCallable('func_end_study_plan')
  const response = await request({
    groupId,
    studyPlanId,
  })
  if (response.data.success) {
    devLog('Success on update study progress')
    return true
  } else {
    devLog('End group study', response.data.message)
    return false
  }
}

async function deleteGroupStudy(groupId: string, studyPlanId: string): Promise<boolean> {
  const request = functions().httpsCallable('func_delete_study_plan')
  const response = await request({
    groupId,
    studyPlanId,
  })
  if (response.data.success) {
    devLog('Success on update study progress')
    return true
  } else {
    devLog('Delete Group Study', response.data.message)
    return false
  }
}

async function updateStartTimeGroupStudy(groupId: string, studyPlanId: string, startDate: Date): Promise<boolean> {
  const request = functions().httpsCallable('func_update_plan_start_date')
  const response = await request({
    groupId,
    studyPlanId,
    startDate: startDate.getTime(),
  })
  if (response.data.success) {
    devLog('Success on update study start date')
    return true
  } else {
    devLog('Error on update study start date', response.data.message)
    return false
  }
}

async function getSmartPlan(
  questionIDs: { [key: string]: string },
  groupId: string,
  startDate: number,
  organisationId?: string,
): Promise<StudyPlan.SmartPlan | undefined> {
  const request = functions().httpsCallable('func_create_smart_plan')
  const response = await request({
    questionIDs,
    groupId,
    startDate,
    organisationId,
  })
  if (response?.data?.success) {
    return response.data.data
  } else {
    devLog('Error on get smart study', response.data.message)
    return undefined
  }
}

async function addFuturePlan(groupId: string, userPlan: StudyPlan.UserPlan, startDate: Date, endDate: Date): Promise<boolean> {
  try {
    const ref = getGroupRef(groupId)
    const futurePlan = {
      startDate,
      endDate,
      id: userPlan.id,
      created: new Date(),
      updated: new Date(),
    }

    await ref.set({ futurePlans: firestore.FieldValue.arrayUnion(futurePlan) }, { merge: true })
    return true
  } catch (error) {
    devLog('Add future plan error', error)
    return false
  }
}

async function getFuturePlans(ids: Array<string>) {
  try {
    const smpCollectionRef = firestore().collection(collections.SMART_PLANS)
    const futurePlansRef = smpCollectionRef.where('id', 'in', ids)
    const futurePlans = await futurePlansRef.get()
    return futurePlans
  } catch (error) {
    devLog('Get future plan error', error)
  }
}

async function removeFuturePlan(groupId, planId) {
  try {
    devLog('removeFuturePlan', groupId, planId)
    await planCollectionref(groupId)?.doc(planId).delete()
  } catch (error) {
    devLog('Remove future plan error', error)
  }
}

async function checkOverlapPlans(groupId: string, startDate: number, duration: number, pace: string): Promise<any> {
  const request = functions().httpsCallable('func_check_overlap_plans')
  const response = await request({
    groupId,
    startDate,
    duration,
    pace,
  })
  if (response.data.success) {
    return response.data
  } else {
    devLog('Error check overlaps plan', response.data.message)
    return false
  }
}

async function getUserAdvancedPlans(userId: string): Promise<StudyPlan.UserPlan[]> {
  try {
    const userPlansRef = getUserStudyPlansRef(userId)
    const userPlans = await userPlansRef.where('type', '==', 'advanced').where('pace', 'in', ['day', 'week']).get()
    return userPlans.docs.map(doc => doc.data()) as StudyPlan.UserPlan[]
  } catch (e) {
    devLog('Get user advanced failed', e)
    return []
  }
}

// Somehow on Android if we trigger too many read requests to Firebase together it will block subsequently other read requests
// The problem with this function is that it will be triggered when we switch group, and it will make the group syncing
// logic stuck (on Android with a user that has a lot of groups). We introduce `isSlowMode` to work around this problem
async function checkCompletedStudyInAllGroups(groups: string[], isCheckingAtLeastOneGroup = false, isSlowMode = false): Promise<boolean> {
  const user = firebase.auth().currentUser
  if (!user) {
    return false
  }

  const groupChunks = chunk(groups, 10)
  const groupInfosSnap: FirebaseFirestoreTypes.DocumentSnapshot[] = []
  for (const groupChunk of groupChunks) {
    groupInfosSnap.push(
      ...(await firestore().collection(collections.GROUPS).where(firestore.FieldPath.documentId(), 'in', groupChunk).get()).docs,
    )
    if (isSlowMode) {
      await wait(100)
    }
  }

  const groupInfos = groupInfosSnap.map(groupInfoSnap => groupInfoSnap.data() as App.Group)
  const planIds = groupInfos
    .map(groupInfo => {
      if (!groupInfo.activeGoal?.id) {
        return undefined
      }

      const endTime = (groupInfo.activeGoal?.endDate as FirebaseFirestoreTypes.Timestamp).toDate()
      if (isAfter(Date.now(), endTime)) {
        return undefined
      }

      return {
        planId: groupInfo.activeGoal?.id,
        groupId: groupInfo.id,
      }
    })
    .filter(Boolean) as {
    planId: string
    groupId: string
  }[]

  const progressSnaps = await Promise.all(planIds.map(({ planId, groupId }) => getUserProgressRef(user.uid, groupId, planId).get()))
  const progressResult = progressSnaps.map(progressSnap => {
    if (progressSnap.empty) {
      return false
    }
    const progress = progressSnap.docs[0].data() as StudyPlan.UserProgress
    return progress.isCompleted
  })

  devLog(`Check completed study in all groups for user ${user.uid}`, planIds, progressResult)

  if (isCheckingAtLeastOneGroup) {
    return progressResult.some(Boolean)
  }

  return !!progressResult.length && progressResult.every(Boolean)
}

export default {
  getUserStudyRef,
  newGroupGoalRef,
  newUserStudyRef,
  createAdvancedStudyDraft,
  createQuickStudy,
  updateAdvancedStudyDraft,
  deleteUserStudy,
  getUserPlanByGroupRef,
  getGroupPlan,
  applyStudyPlanToGroup,
  updateGroupStudyProgress,
  getUserProgressRef,
  endGroupStudy,
  deleteGroupStudy,
  updateStartTimeGroupStudy,
  getPlanData,
  planCollectionref,
  getSmartPlan,
  smartPlanRef,
  addFuturePlan,
  getFuturePlans,
  removeFuturePlan,
  getGroupRef,
  checkOverlapPlans,
  getUserAdvancedPlans,
  checkCompletedStudyInAllGroups,
}
