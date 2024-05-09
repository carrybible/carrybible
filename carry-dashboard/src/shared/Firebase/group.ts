import { ChooseImageType } from '@components/Avatar'
import { SocialMediaPost } from '@dts/Group'
import { Plan } from '@dts/Plans'
import { Group } from '@redux/slices/group'
import Branch from '@shared/Branch'
import Config from '@shared/Config'
import Firebase from '@shared/Firebase/index'
import axios from 'axios'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { isNil, omitBy } from 'lodash'
import { Campus } from './campus'

import { MemberDataType } from './member'
import { uploadBase64Image } from './storage'

export const getGroups = async ({
  scope,
  searchText,
  memberId,
  limit,
  page,
  orders,
}: {
  searchText?: string
  memberId?: string
  scope?: string
  limit?: number
  page?: number
  orders?: {
    key: 'name' | 'leader' | 'member'
    order: 'asc' | 'desc'
  }[]
}): Promise<{
  message?: string
  success: boolean
  data: Array<{
    groupByValue: string
    data: Array<Group>
  }>
}> => {
  const funcGetGroups = httpsCallable(Firebase.functions, 'func_get_groups')
  const {
    data: { data, success, message },
  } = (await funcGetGroups({
    groupBy: scope,
    search: searchText,
    memberId: memberId,
    limit,
    page,
    orders,
  })) as { data: any }

  if (data?.groupByValue === 'Unknown')
    return { data: [data], success, message }
  return { data, success, message }
}

export type GroupPlanType = {
  id: string
  name: string
  duration: number
  startDate: number
  status: 'week' | 'day' | string
  endDate: number
  image?: string
  planVideo?: string
  planYouTubeVideoUrl?: string
}

export type GroupDetailType = {
  organisation: {
    id: string
  }
  timeZone?: number
  id: string
  name: string
  permissions: string[]
  inviteCode: string
  leader: MemberDataType
  members?: MemberDataType[]
  plans?: GroupPlanType[]
  image: string
  activeGoal?: Plan
  campus?: Campus
}

export type GroupDetailResponseType = {
  success: boolean
  message?: string
  data: GroupDetailType
}

export const getGroupDetails = async ({
  groupId,
}: {
  groupId: string
}): Promise<GroupDetailResponseType> => {
  const funcGetGroupDetails = httpsCallable(
    Firebase.functions,
    'func_get_group_detail'
  )
  const { data } = (await funcGetGroupDetails({
    groupId,
  })) as { data: GroupDetailResponseType }

  return data
}

export const getGroupSocialPosts = async ({
  groupId,
}: {
  groupId: string
}): Promise<{
  success: boolean
  message?: string
  data: { plans: Plan[] }
}> => {
  const funcGetGroupSocialPosts = httpsCallable(
    Firebase.functions,
    'func_get_group_social_posts'
  )
  const { data } = (await funcGetGroupSocialPosts({
    groupId,
  })) as {
    data: {
      success: boolean
      message?: string
      data: { plans: Plan[] }
    }
  }
  return data
}

export const generateInviteLink = async (
  groupId: string,
  orgId?: string,
  force = false
): Promise<{ link: string; inviteId: string } | null> => {
  const user = Firebase.auth.currentUser
  if (!user || !groupId) {
    return null
  }

  const dynamicLink = await localStorage.getItem(`@link_${groupId}`)
  const inviteId = await localStorage.getItem(`@iid_${groupId}`)
  if (!inviteId || !dynamicLink || force) {
    const invitesRef = collection(
      Firebase.firestore,
      Firebase.collections.INVITES
    )
    const newInviteRef = doc(invitesRef)

    const dlURL = await Branch.createBranchDynamicLink(
      {
        uid: user.uid,
        groupId,
        orgId,
      },
      newInviteRef.id
    )

    // Create firebase DL
    await localStorage.setItem(`@link_${groupId}`, dlURL)
    await localStorage.setItem(`@iid_${groupId}`, newInviteRef.id)

    // Create invites
    const data = {
      uid: user.uid,
      groupId: groupId,
      url: dlURL,
      created: serverTimestamp(),
    }
    await setDoc(newInviteRef, data)

    return { link: dlURL, inviteId: newInviteRef.id }
  }

  return { link: dynamicLink, inviteId }
}

export const generateInviteQrCode = async (
  inviteId: string,
  orgId?: string
): Promise<{
  success: boolean
  errorMessage?: string
  data: {
    url: string
  }
}> => {
  const response = await axios.get(
    `${Config.SERVER}/func_generate_invite_qr_code`,
    {
      params: {
        inviteId,
        orgId,
      },
    }
  )

  return response.data
}

export const deleteGroup = async (groupId: string) => {
  try {
    const user = Firebase.auth.currentUser
    if (!user || !groupId) {
      return false
    }
    const docRef = doc(Firebase.firestore, Firebase.collections.GROUPS, groupId)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    return false
  }
}

type UpdateGroupParams = {
  groupId: string
  image: ChooseImageType
  name: string
  timeZone: number
}

export const updateGroup = async (
  info: UpdateGroupParams
): Promise<{ success: boolean; message?: string }> => {
  try {
    const user = Firebase.auth.currentUser
    if (!user || !info.groupId) {
      return { success: false, message: 'groups.group-id-missing' }
    }
    const docRef = doc(
      Firebase.firestore,
      Firebase.collections.GROUPS,
      info.groupId
    )
    const id = await info.groupId

    // Upload image from local
    if (info.image.type === 'gallery' && info.image.src) {
      const imgUrl = await getImage(info.image, user.uid, id)
      Object.assign(info, { image: imgUrl })
    } else {
      Object.assign(info, { image: info.image.src })
    }
    await updateDoc(docRef, omitBy(info, isNil))
    return { success: true }
  } catch (error) {
    return { success: false, message: 'groups.failed-update-group' }
  }
}

type CreateGroupParams = {
  emails?: string[]
  uids?: string[]
  name: string
  timeZone: number
  orgId?: string
  image: ChooseImageType
  campusId: string
}

export type CreateGroupResp = {
  success: boolean
  isAuthen?: boolean
  message?: string
}

export const inviteGroup = async (
  info: CreateGroupParams
): Promise<CreateGroupResp> => {
  try {
    const user = Firebase.auth.currentUser
    if (!user || (!info?.emails?.length && !info?.uids?.length)) {
      return { success: false, message: 'group.group-info-missing' }
    }
    const funcSendInvite = httpsCallable(Firebase.functions, 'func_send_invite')
    const imgUrl = await getImage(info.image, user.uid, `invite${Date.now()}`)
    const { data } = (await funcSendInvite({
      uids: info.uids,
      emails: info.emails,
      role: 'leader',
      target: {
        type: 'create-group',
        details: {
          name: info.name,
          timeZone: info.timeZone,
          imageUrl: imgUrl,
          campusId: info.campusId,
        },
      },
      isProduction: Config.ENV === 'prod',
    })) as { data: any }
    return data as CreateGroupResp
  } catch (error) {
    return { success: false, message: 'groups.failed-create-group' }
  }
}

export const createGroup = async (
  info: CreateGroupParams & any
): Promise<{ success: boolean; message?: string }> => {
  try {
    const user = Firebase.auth.currentUser
    if (!user) {
      return { success: false, message: info.t('user-not-found') }
    }
    const groupCollectionRef = collection(
      Firebase.firestore,
      Firebase.collections.GROUPS
    )

    const groupRef = doc(groupCollectionRef)

    const id = groupRef.id
    const imgUrl = await getImage(info.image, info?.uids?.[0] || user.uid, id)

    await setDoc(groupRef, {
      id: id,
      image: imgUrl,
      name: info.name,
      visibility: 'private',
      hasActiveGoal: false,
      publicEnemy: true,
      timeZone: info.timeZone,
      communicationType: 'group',
      owner: info?.uids?.[0], // TODO: support multiple leader
      memberCount: 1,
      service: 'StreamIO',
      created: new Date(),
      updated: new Date(),
      activity: 60,
      age: 'Any',
      ageFrom: 0,
      ageTo: 100,
      isNewGroup: true,
      location: '',
      members: [info?.uids?.[0]], // TODO: support multiple leader
      organisation: {
        id: info.orgId,
        ...(info.campusId ? { campusId: info.campusId } : {}),
      },
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'group.create-failed' }
  }
}

const getImage = async (image: ChooseImageType, uid: string, id: string) => {
  let imgUrl = image?.src || ''
  // Upload image from local
  if (image.type === 'gallery' && image.src) {
    imgUrl = await uploadBase64Image(
      uid,
      'images',
      `group_avatar_${id}`,
      image.src
    )
  }
  return imgUrl
}

export const getPlanDetail = async (
  groupId: string,
  planId: string
): Promise<Plan> => {
  const planRef = doc(
    Firebase.firestore,
    Firebase.collections.GROUPS,
    groupId,
    Firebase.collections.PLANS,
    planId
  )
  return (await (await getDoc(planRef)).data()) as Plan
}

// From new version, move to use firebase function directly to improve speed
export const getSocialMediaPosts = async (
  groupId: string
): Promise<SocialMediaPost[]> => {
  const q = query(
    collection(
      Firebase.firestore,
      Firebase.collections.GROUPS,
      groupId,
      Firebase.collections.GROUP_VIDEOS
    )
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => doc.data() as SocialMediaPost)
}
