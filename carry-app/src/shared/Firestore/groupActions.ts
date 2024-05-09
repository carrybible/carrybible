import firebase from '@react-native-firebase/app'
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { sub } from 'date-fns'

import collections from '@shared/Firestore/collections'
import GroupActions, { GroupActionsType } from '@dts/groupAction'
import { RootState } from '@dts/state'
import I18n from 'i18n-js'

type ResponseType<T = void> =
  | {
      success: false
      message: string
    }
  | { success: true; data?: T }

function groupActionRef(groupId: string, groupActionId: string): FirebaseFirestoreTypes.DocumentReference<GroupActions> {
  return firestore().doc(`${collections.GROUPS}/${groupId}/${collections.ACTIONS}/${groupActionId}`)
}

function newGroupActionRef(groupId: string) {
  return firestore().collection(`${collections.GROUPS}/${groupId}/${collections.ACTIONS}`).doc()
}

async function create(params: { groupId: string; type: GroupActionsType; content: string; requestText?: string }): Promise<ResponseType> {
  const user = firebase.auth().currentUser
  if (!user) {
    return { success: false, message: 'User not found!' }
  }
  const { groupId, type, content } = params

  const ref = newGroupActionRef(groupId)
  const groupActionData: GroupActions = {
    id: ref.id,
    content,
    type,
    creator: user.uid,
    viewerIds: [user.uid],
    created: firestore.FieldValue.serverTimestamp(),
    updated: firestore.FieldValue.serverTimestamp(),
  }
  if (params.requestText) {
    groupActionData.requestText = params.requestText
  }
  await ref.set(groupActionData)
  return { success: true }
}

async function view(groupId: string, groupActionId: string): Promise<ResponseType> {
  const user = firebase.auth().currentUser
  if (!user) {
    return { success: false, message: 'User not found!' }
  }

  const ref = groupActionRef(groupId, groupActionId)
  await ref.update({
    viewerIds: firestore.FieldValue.arrayUnion(user.uid),
    updated: firestore.FieldValue.serverTimestamp(),
  })
  return { success: true }
}

async function viewAll(groupId: string, ids: Array<string>): Promise<ResponseType> {
  const user = firebase.auth().currentUser
  if (!user) {
    return { success: false, message: 'User not found!' }
  }

  const batch = firestore().batch()
  ids.forEach(id => {
    const ref = groupActionRef(groupId, id)
    batch.update(ref, {
      viewerIds: firestore.FieldValue.arrayUnion(user.uid),
      updated: firestore.FieldValue.serverTimestamp(),
    })
  })
  await batch.commit()
  return { success: true }
}

async function load({
  groupId,
  type,
  latestCreatedTime,
  limit = 25,
}: {
  groupId: string
  type: GroupActionsType
  latestCreatedTime?: FirebaseFirestoreTypes.FieldValue
  limit?: number
}): Promise<ResponseType<GroupActions[]>> {
  const user = firebase.auth().currentUser
  if (!user) {
    return { success: false, message: 'User not found!' }
  }
  const colRef = firestore().collection(`${collections.GROUPS}/${groupId}/${collections.ACTIONS}`).where('type', '==', type)
  const filterTime = sub(Date.now(), { days: 1 })
  const resultActionList: GroupActions[] = []
  if (!latestCreatedTime) {
    const unread: GroupActions[] = []
    const read: GroupActions[] = []
    const data = await colRef.where('created', '>', filterTime).orderBy('created', 'desc').get()
    data.forEach(doc => {
      const groupActionData = doc.data() as GroupActions
      if (groupActionData.viewerIds.includes(user.uid)) {
        read.push(groupActionData)
      } else {
        unread.push(groupActionData)
      }
    })
    resultActionList.push(...unread, ...read)
  }
  const listRef = colRef.where('created', '<=', filterTime).orderBy('created', 'desc').limit(limit)
  const data = await (latestCreatedTime ? listRef.startAfter(latestCreatedTime) : listRef).get()
  data.forEach(doc => {
    resultActionList.push(doc.data() as GroupActions)
  })

  return { success: true, data: resultActionList }
}

type GroupActionInfoType = NonNullable<RootState['groupActions']['data']>[number]
async function get({ groupId, groupActionId }: { groupId: string; groupActionId: string }): Promise<GroupActionInfoType | null> {
  const groupAction = await groupActionRef(groupId, groupActionId).get()
  const data = groupAction.data() as GroupActions | null
  if (!data) {
    return null
  }
  const userInfo = await firestore().collection(collections.USERS).doc(data.creator).get()
  const userInfoData = userInfo.data()
  if (!userInfoData) {
    return null
  }
  return {
    ...data,
    unread: false,
    creatorInfo: {
      userId: data.creator,
      image: userInfoData.image,
      name: userInfoData.name,
    },
  }
}

async function deleteAction({ uid, groupId, groupActionId }: { uid: string; groupId: string; groupActionId: string }): Promise<boolean> {
  const actionRef = groupActionRef(groupId, groupActionId)
  const groupActionDoc = await actionRef.get()
  const data = groupActionDoc.data() as GroupActions | null
  if (!data) {
    return false
  }

  if (data.creator !== uid) {
    toast.error(I18n.t('error.Have no permission'))
    return false
  }
  try {
    await actionRef.delete()
    return true
  } catch (e) {
    toast.error(I18n.t('text.Something went wrong'))
    return false
  }
}

export default { create, view, load, get, viewAll, deleteAction }
