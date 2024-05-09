/* eslint-disable max-lines */
import { Score, ScoreDailyActionType } from '@dts/score'
import { StudyPlan } from '@dts/study'
import { WeeklyReview } from '@dts/weeklyReview'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import firebase from '@react-native-firebase/app'
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import { Channel } from 'stream-chat'
import { Branch } from '..'
import Constants from '../Constants'
import Utils, { getConfig } from '../Utils'
import Auth from './auth'
import collections from './collections'

/**
 * Return the reference to a new Space in Firestore
 */

function ref(id: string) {
  return firestore().collection(collections.GROUPS).doc(id)
}
function newGroupRef() {
  return firestore().collection(collections.GROUPS).doc()
}
function planRef(groupId: string, planId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS).doc(planId)
}
function plansRef(groupId: string) {
  return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS)
}
function scoreRef(groupId: string) {
  return ref(groupId).collection(collections.SCORE)
}

async function checkGroupExist(groupId: string) {
  const checkGroupExist = await firestore()
    .collection(`${collections.GROUPS}`)
    .where('id', '==', groupId)
    .get()
    .then(snap => snap.docs.map(doc => doc.data()))
  return checkGroupExist.length > 0 ? true : false
}

/**
 * Create a group
 */

const createGroup = async (data: {
  name?: string
  withFriendId?: string
  image?: string
  visibility: string
  organisation?: any
  responses?: any
}): Promise<{ success: boolean; message?: string; data?: App.Group }> => {
  // Get current logged in user
  const user = firebase.auth().currentUser
  if (!user) return { success: false, message: 'User not found!' }

  const networkStatus = await NetInfo.fetch()
  if (!networkStatus.isConnected) {
    return { success: false, message: 'Please reconnect\nto internet!' }
  }

  // Try to create group on Firestore
  try {
    const date = new Date()
    const offsetInHours = date.getTimezoneOffset() / 60

    const ref = newGroupRef()
    const groupData = {
      id: ref.id,
      name: data.name || 'Unnamed',
      visibility: data.visibility.toLowerCase(),
      hasActiveGoal: false,
      publicEnemy: true,
      timeZone: offsetInHours,
      communicationType: 'group',
      owner: user.uid,
      memberCount: 1,
      image: data.image || '',
      service: 'StreamIO',
      created: firestore.FieldValue.serverTimestamp(),
      updated: firestore.FieldValue.serverTimestamp(),
      activity: 60,
      age: 'Any',
      ageFrom: 0,
      ageTo: 100,
      isNewGroup: true,
      location: '',
      members: [user.uid],
      ...(data.organisation ? { organisation: data.organisation } : {}),
    }
    await ref.set({ ...groupData })
    // await delay(500)

    if (groupData?.id) {
      await Auth.updateUser({
        buttonOverlayGroups: firestore.FieldValue.arrayUnion(groupData?.id),
      })
    }
    global.Analytics.event(Constants.EVENTS.GROUP.CREATE_SUCCESS)
    // @ts-ignore
    return { success: true, data: groupData }
  } catch (e) {
    devWarn('Error create group', e)
    return { success: false, message: 'Can not\ncreate group!' }
    // throw e
  }
}

const deleteMember = async ({ groupId, memberId, type = 'remove' }) => {
  try {
    const { data } = await functions().httpsCallable('func_remove_group_member')({
      groupId,
      memberId,
      type,
    })
    if (data.success) {
      return true
    }
  } catch (e) {
    devLog('[Delete member]', e)
  }

  if (type === 'leave') {
    toast.error('error.leave_fail')
  } else {
    toast.error('error.remove_fail')
  }
  return false
}

const muteMember = async ({ groupId, memberId, mute }: { groupId: string; memberId?: string; mute: boolean }) => {
  try {
    // Get current logged in user
    const user = firebase.auth().currentUser
    if (!user) return undefined
    const uid = memberId || user.uid

    const groupRef = firestore().collection(`${collections.GROUPS}`).doc(groupId)
    if (mute) await groupRef.set({ muteMembers: firestore.FieldValue.arrayUnion(uid) }, { merge: true })
    else await groupRef.set({ muteMembers: firestore.FieldValue.arrayRemove(uid) }, { merge: true })
  } catch (e) {
    devWarn(e)
  }
}

const getOneVerifiedGroup = async () => {
  const snap = firestore()
    .collection(collections.GROUPS)
    .where('verified', '==', 'carry')
    .where('hasActiveGoal', '==', true)
    .where('memberCount', '<=', 20)
    .orderBy('memberCount', 'desc')
    .limit(1)
  const groups = await snap.get()
  if (groups.size === 0) return undefined
  return groups.docs[0].data()
}

const getDefaultGroup = async (id: string): Promise<any> => {
  const snap = firestore().collection(collections.GROUPS).doc(id)
  const g = await snap.get()
  return g.data()
}

const deleteGroup = async (data: { groupId: string }) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  try {
    const group = await firestore().collection(`${collections.GROUPS}`).doc(data.groupId)
    group.delete()
  } catch (e) {
    devWarn(e)
    throw e
  }
}

const getGroup = async (data: any) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  try {
    const group = await firestore().collection(`${collections.GROUPS}`).doc(`${data.groupId}`).get()
    return group.data()
  } catch (e) {
    return { isError: true, error: e }
  }
}

const getAdvanceGoalDraft = async (groupId: string) => {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  const goals = await firestore().collection(`${collections.GROUPS}/${groupId}/${collections.DRAFTS}`).get()
  return goals.docs.map(value => value.data())
}

function threadRef(groupId: string, threadId?: string) {
  if (!threadId) return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.THREADS)
  else return firestore().collection(collections.GROUPS).doc(groupId).collection(collections.THREADS).doc(threadId)
}

function unreadThreadsRef(groupId: string, planId?: string) {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  let ref = firestore()
    .collectionGroup(collections.UNREAD_THREADS)
    .where('uid', '==', user.uid)
    .where('groupId', '==', groupId)
    .where('isUnread', '==', true)

  if (planId) {
    ref = ref.where('planId', '==', planId)
  }

  return ref
}

async function generateDynamicLink(group?: Channel['data'], force = false): Promise<[link?: string, inviteId?: string]> {
  const user = firebase.auth().currentUser
  if (!user || !group) return [undefined, undefined]

  const dynamicLink = await AsyncStorage.getItem(`@link_${group.id}`)
  const inviteId = await AsyncStorage.getItem(`@iid_${group.id}`)
  // If uuid or dynamic link of the group is not set
  // Or the user force to regenerate the DL
  // Create new uuid and update to firebase
  if (!inviteId || !dynamicLink || force) {
    const ref = firestore().collection('invites').doc()
    const linkConfig = getConfig('invitation_link')
    // Change to use DL by Branch
    const dlURL = await Branch.createBranchDynamicLink(
      {
        uid: user?.uid,
        groupId: `${group.id}`,
        title: linkConfig.preview_title,
        descriptionText: linkConfig.preview_text,
        imageUrl: linkConfig.preview_image,
      },
      ref.id,
    )

    // Create firebase DL
    await AsyncStorage.setItem(`@link_${group.id}`, dlURL)
    await AsyncStorage.setItem(`@iid_${group.id}`, ref.id)

    // Create invites
    const data = {
      uid: user?.uid,
      groupId: group.id,
      url: dlURL,
      created: firestore.FieldValue.serverTimestamp(),
    }
    await ref.set(data)
    devLog('[GEN DL]', dlURL)
    return [dlURL, ref.id]
  }

  devLog('GET LOCAL DL]', dynamicLink)
  return [dynamicLink, inviteId]
}

async function acceptInvitation(invitationID: string) {
  try {
    const { data } = await functions().httpsCallable('func_invite_accept')(
      invitationID.length <= 10 ? invitationID.replace(/[^a-zA-Z0-9]/g, '') : invitationID,
    )
    const groupId = data?.response?.invite?.groupId
    if (groupId) {
      await Auth.updateUser({
        buttonOverlayGroups: firestore.FieldValue.arrayUnion(groupId),
      })
    }
    return data
  } catch (e) {
    Utils.sendError(e, 'acceptSpaceInvitation')
  }
  return undefined
}

async function getInvitationIdById(id: string) {
  let resError: any

  if (!id) return null
  if (/^[A-Za-z][-A-Za-z0-9_:.]*$/.test(id)) {
    try {
      // const user = firebase.auth().currentUser
      // if (!user) return undefined
      const invitations = await firestore().collection('invites').doc(id).get()
      if (invitations.exists) return invitations
    } catch (error) {
      resError = error
    }
  }

  try {
    const invitationByUrl = await firestore().collection('invites').where('url', '==', id).get()
    if (invitationByUrl.docs?.[0]) {
      return invitationByUrl.docs?.[0]
    }
  } catch (error) {
    resError = error
  }
  Utils.sendError(resError, 'getInvitationIdByDynamicLink')
  return null
}

async function getInvitationIdByDynamicLink(dynamicLink: string) {
  try {
    // const user = firebase.auth().currentUser
    // if (!user) return undefined
    const invitations = await (await firestore().collection('invites').where('url', '==', dynamicLink).get()).docs
    if (!invitations?.length) {
      return null
    }
    return invitations[0]
  } catch (error) {
    Utils.sendError(error, 'getInvitationIdByDynamicLink')
  }
}

async function getInvitationByCode(code: string): Promise<App.Codes | null> {
  try {
    const invitation = firestore().collection(collections.CODES).doc(code)
    return (await invitation.get()).data() as App.Codes
  } catch (error) {
    Utils.sendError(error, 'getInvitationByCode')
    return null
  }
}

async function updateGroup(data: any, groupId: string) {
  const user = firebase.auth().currentUser
  if (!user || !groupId) return undefined
  try {
    await firestore()
      .collection(collections.GROUPS)
      .doc(groupId)
      .set({ ...data, updated: firestore.FieldValue.serverTimestamp() }, { merge: true })
    return true
  } catch (e) {
    devWarn('Error at update group', e)
    return false
  }
}

async function joinGroup(groupId, memberId) {
  try {
    // Get current logged in user
    const user = firebase.auth().currentUser
    if (!user) return undefined
    const uid = memberId || user.uid
    const groupRef = firestore().collection(`${collections.GROUPS}`).doc(groupId)
    await groupRef.set({ members: firestore.FieldValue.arrayUnion(uid) }, { merge: true })
  } catch (e) {
    devWarn(e)
  }
}

const getUsersGroup = async () => {
  try {
    // Get current logged in user
    const user = firebase.auth().currentUser
    if (!user) return []
    const groups = await firestore().collection(`${collections.GROUPS}`).where('members', 'array-contains', user.uid).get()
    return groups.docs
  } catch (e) {
    devWarn(e)
    return []
  }
}

async function triggerCreateMessage(
  plan: StudyPlan.GroupPlan | undefined,
  blockIndex: number,
  showLoading: () => void,
  hideLoading: () => void,
) {
  if (!plan) return plan
  try {
    let isMissingMessage = false
    if (plan?.blocks?.[blockIndex - 1]) {
      plan.blocks[blockIndex - 1].activities.forEach(act => {
        if (act.type === 'question' && !act.messageId) {
          isMissingMessage = true
        }
      })
    }
    if (isMissingMessage) {
      showLoading()
      const { data } = await functions().httpsCallable('func_trigger_create_message')({
        groupId: plan.targetGroupId,
        planId: plan.id,
        blockIndex,
      })
      hideLoading()
      if (data && data.success) {
        return { ...plan, blocks: data.data }
      } else {
        return plan
      }
    }
    return plan
  } catch (e) {
    devLog('[ERROR TRIGGER]', e)
    Utils.sendError(e, 'func_trigger_create_message')
    hideLoading()
  }
  return plan
}

async function triggerAddActivePlan(groupId: string, showLoading?: () => void, hideLoading?: () => void) {
  try {
    showLoading?.()
    const { data } = await functions().httpsCallable('func_trigger_change_active_plan')({
      groupId: groupId,
    })
    hideLoading?.()
    return data
  } catch (e) {
    Utils.sendError(e, 'func_trigger_change_active_plan')
    hideLoading?.()
  }
  return undefined
}

async function addResponses(groupId: string, responses: Array<any>) {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  try {
    const group = ref(groupId)
    for (let i = 0; i < responses?.length || 0; i += 1) {
      group.collection(collections.RESPONSES).add(responses[i])
    }
  } catch (e) {
    Utils.sendError(e, 'function_add_responses')
  }
}

async function generateInviteCode(groupId: string) {
  try {
    const { data } = await functions().httpsCallable('func_generate_code')({ groupId })
    return data
  } catch (e) {
    Utils.sendError(e, 'acceptSpaceInvitation')
  }
  return undefined
}

async function updateScore(type: ScoreDailyActionType, groupId: string) {
  const user = firebase.auth().currentUser
  if (!user || !groupId) {
    return
  }
  const request = functions().httpsCallable('func_update_group_activity_score')
  await request({
    groupId: groupId,
    type,
  })
}

async function getGroupScore(groupId: string): Promise<{ [userId: string]: Score } | null> {
  const user = firebase.auth().currentUser
  if (!user || !groupId) {
    return null
  }
  const score = {}
  const scoreSnap = await scoreRef(groupId).get()
  scoreSnap.forEach(userScore => {
    score[userScore.id] = userScore.data()
  })

  return score
}

async function getWeeklyReview(groupId: string): Promise<WeeklyReview> {
  const user = firebase.auth().currentUser
  if (!user || !groupId) {
    throw new Error(`Can not found user or group! Please try again later`)
  }
  const request = functions().httpsCallable('func_get_weekly_review')
  const {
    data: { success, response },
  } = await request({
    groupId,
  })
  if (success) {
    return response.data as WeeklyReview
  }
  throw new Error(response.message ?? 'Something went wrong! Please try again later')
}

async function syncMembersFromFirestoreToStream(groupId) {
  try {
    const data = await functions().httpsCallable('func_sync_members_to_stream')({
      groupId,
    })
    devLog('Sync member done', data)
  } catch (e) {
    devLog('Error', e)
  }
  return { success: false, message: 'Verify Fail!' }
}

async function updateThreadViewer(groupId: string, threadId: string, lastReplyCount: number) {
  devLog('updateThreadViewer', groupId, threadId, lastReplyCount)
  try {
    const user = firebase.auth().currentUser
    if (!user || !groupId || !threadId) {
      return null
    }

    const ref = threadRef(groupId, threadId) as FirebaseFirestoreTypes.DocumentReference
    const thread = (await ref.get()).data() as App.Thread
    const viewer = thread.viewers?.find(i => i.id === user.uid)

    await ref.collection(collections.UNREAD_THREADS).doc(user.uid).set({
      isUnread: false,
      updated: firestore.FieldValue.serverTimestamp(),
    })

    if (viewer) {
      await ref.update({ viewers: firestore.FieldValue.arrayRemove(viewer) })
    }
    await ref.set(
      { viewers: firestore.FieldValue.arrayUnion({ last_read: new Date(), last_reply_count: lastReplyCount, id: user.uid }) },
      { merge: true },
    )

    return { success: true, message: 'Updated viewers of thread' }
  } catch (error) {
    return { success: false, message: 'Updated viewers of thread Fail!' }
  }
}

async function viewAllThread(groupId: string, unreadData: Array<any>) {
  try {
    const user = firebase.auth().currentUser
    if (!user) {
      return { success: false, message: 'User not found!' }
    }
    const batch = firestore().batch()
    await Promise.all(
      unreadData.map(async t => {
        // @ts-ignore
        const thread = (await threadRef(groupId, t.id).get()).data() as any
        const viewer = thread.viewers?.find(i => i.id === user.uid)
        const ref = firestore().collection(collections.GROUPS).doc(groupId).collection(collections.THREADS).doc(t.id)
        viewer && batch.update(ref, { viewers: firestore.FieldValue.arrayRemove(viewer) })
        batch.update(ref.collection(collections.UNREAD_THREADS).doc(user.uid), {
          isUnread: false,
          updated: firestore.FieldValue.serverTimestamp(),
        })
        batch.set(
          ref,
          { viewers: firestore.FieldValue.arrayUnion({ last_read: new Date(), last_reply_count: t.replyCount, id: user.uid }) },
          { merge: true },
        )
      }),
    )
    await batch.commit()
    return { success: true, message: 'Updated viewers of thread' }
  } catch (error) {
    devLog('error', error)
    return { success: false, message: 'Updated viewers of thread Fail!' }
  }
}

async function getChaptersByThreadId(groupId: string, threadId: string) {
  const planData = await firestore().collection(collections.GROUPS).doc(groupId).collection(collections.PLANS).get()
  const plans = planData.docs.map(i => i.data())
  for (const plan of plans || []) {
    for (const block of plan?.blocks || []) {
      const chapters = Array<any>()

      for (const activity of block?.activities || []) {
        const c = activity.chapter
        if (activity.verses) {
          Object.assign(c, { fromVerse: [activity.verses[0].from], toVerse: [activity.verses[0].to] })
        }
        activity?.chapter && chapters.push(c)
        if (activity?.messageId === threadId) return chapters
      }
    }
  }
  return null
}

async function updateGroupPlanBlock({
  groupId,
  plan,
  newBlock,
  blockIndex,
}: {
  groupId: string
  plan: StudyPlan.GroupPlan
  newBlock: StudyPlan.Block
  blockIndex: number
}): Promise<boolean> {
  try {
    const groupPlanRef = planRef(groupId, plan.id)
    const newBlocks = [...plan.blocks]
    newBlocks[blockIndex] = newBlock
    await groupPlanRef.update({
      blocks: newBlocks,
    })
    return true
  } catch (e) {
    devLog('Failed to update group plan block', e)
    return false
  }
}

async function getGroupPlan({ groupId, planId }: { groupId: string; planId: string }) {
  try {
    const groupPlanRef = planRef(groupId, planId)
    const groupPlanSnap = await groupPlanRef.get()
    return groupPlanSnap.data() as StudyPlan.GroupPlan
  } catch (e) {
    devLog('Failed to get group plan', e)
  }
}

export default {
  ref,
  planRef,
  plansRef,
  unreadThreadsRef,
  checkGroupExist,
  create: createGroup,
  getGroup: getGroup,
  getOneVerifiedGroup,
  getDefaultGroup,
  getUsersGroup: getUsersGroup,
  updateGroup: updateGroup,
  deleteMember: deleteMember,
  deleteGroup: deleteGroup,
  threadRef,
  generateDynamicLink,
  acceptInvitation,
  muteMember,
  joinGroup,
  getAdvanceGoalDraft,
  getInvitationIdByDynamicLink,
  triggerCreateMessage,
  addResponses,
  getInvitationIdById,
  getInvitationByCode,
  generateInviteCode,
  updateScore,
  getGroupScore,
  getWeeklyReview,
  triggerAddActivePlan,
  syncMembersFromFirestoreToStream,
  updateThreadViewer,
  getChaptersByThreadId,
  updateGroupPlanBlock,
  viewAllThread,
  getGroupPlan,
}
