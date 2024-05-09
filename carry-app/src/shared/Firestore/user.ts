import { App } from '@dts/app'
import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import Utils from '../Utils'
import collections from './collections'

const getUser = async (data: { uid: string }) => {
  const user = firebase.auth().currentUser
  if (!user || !data.uid) return undefined

  const userSnap = await firestore().collection(`${collections.USERS}`).doc(data.uid).get()
  return userSnap.data()
}

const getUserWithoutAuth = async (data: { uid: string }) => {
  const user = await firestore().collection(`${collections.USERS}`).doc(data.uid).get()
  return user.data()
}

const watchUserData = (data: { uid: string }, callback: (value: any) => void) => {
  const user = firebase.auth().currentUser
  if (!user || !data.uid) return undefined
  return firestore().collection(`${collections.USERS}`).doc(data.uid).onSnapshot(callback)
}

async function requestJoinGroup(groupId: string) {
  const user = firebase.auth().currentUser
  if (!user) return undefined
  try {
    const { data } = await functions().httpsCallable('func_join_group')(groupId)
    return data
  } catch (e) {
    // @ts-ignore
    Utils.sendError('Error requestJoinGroup', e.message, e)
    return { isError: true, error: e }
  }
}

type LeaderPromptResult = {
  success: boolean
  response: {
    showPrompt: boolean
    tip?: { title: string; content: string }
    video?: string
  }
}

async function getLeaderPrompt(): Promise<LeaderPromptResult['response']> {
  try {
    const response = (await functions().httpsCallable('func_get_leader_prompts')()).data as LeaderPromptResult
    if (!response.success) {
      return { showPrompt: false }
    }
    return response.response
  } catch (e) {
    return { showPrompt: false }
  }
}

async function removeGroupFromOverlay(groupId: string) {
  try {
    const user = firebase.auth().currentUser
    if (!user?.uid) return
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({ buttonOverlayGroups: firestore.FieldValue.arrayRemove(groupId) })
    return { success: true, message: 'removed group from buttonOverlayGroups' }
  } catch (error) {
    return null
  }
}

async function updateUserCampaign({ blockIndex, planId, campaignId }) {
  const user = firebase.auth().currentUser
  if (!campaignId || !user) return
  await firestore().collection('users').doc(user.uid).collection(collections.CAMPAIGNS).doc(campaignId).set({
    showedStudy: {
      planId,
      blockIndex,
    },
    updated: firestore.FieldValue.serverTimestamp(),
  })
}

async function getUserCampaign(campaignId) {
  const user = firebase.auth().currentUser
  if (!campaignId || !user) return
  const capaignRef = await firestore().collection('users').doc(user.uid).collection(collections.CAMPAIGNS).doc(campaignId)
  return (await (await capaignRef.get()).data()) as App.UserCampaign
}

export default {
  getUser: getUser,
  watchUserData: watchUserData,
  requestJoinGroup: requestJoinGroup,
  getUserWithoutAuth,
  getLeaderPrompt,
  removeGroupFromOverlay,
  updateUserCampaign,
  getUserCampaign,
}
