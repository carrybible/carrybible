import _, { pick } from 'lodash'
import { appCheck, auth, firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { sendDashboardInvite, sendInviteGroupLeader } from '../../shared/MainChimp'

import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_USER_AVATAR, INVITE_TYPE } from '../../shared/Constants'
import { isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import { UserRecord } from 'firebase-functions/v1/auth'
import { Service, Utils } from '../../shared'

const func_send_invite = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: Request.inviteRequest, context) => {
  try {
    const uid = context.auth?.uid
    const type = payload?.target.type
    const role: string | undefined = payload?.role
    const permissionsError = {
      success: false,
      isAuthen: false,
      message: 'Have no permission to access',
    }
    const authen = await isAuthen(uid)

    let isAuthValid = true

    if (!authen.success) isAuthValid = false
    if (type === 'create-group' && !authen.permissions?.includes('invite-create-group')) isAuthValid = false
    if (type === 'add-dashboard-user') {
      switch (role) {
        case 'campus-user':
          if (!authen.permissions?.includes('add-dashboard-campus-user')) isAuthValid = false
          break
        case 'campus-leader':
          if (!authen.permissions?.includes('add-dashboard-campus-leader')) isAuthValid = false
          break
        case 'admin':
          if (!authen.permissions?.includes('add-dashboard-admin')) isAuthValid = false
          break
        default:
          isAuthValid = false
          break
      }
    }
    if (!isAuthValid) return permissionsError

    const currentUser = authen.user
    const org = (
      await firestore().doc(`organisations/${currentUser?.organisation?.id}`).get()
    ).data() as Carry.Organisation
    if (!currentUser || !org)
      return {
        success: false,
        isAuthen: false,
        message: 'Invalid data',
        error: 'Org invalid!',
      }

    const cleanData: Request.inviteRequest = {
      ...payload,
      emails: (payload.emails || []).map((value) => value.trim()),
      uids: (payload.uids || []).map((value) => value.trim()),
    }

    switch (payload.target.type) {
      case INVITE_TYPE.CREATE_GROUP:
        await processInviteGroup(cleanData, currentUser)
        break
      case INVITE_TYPE.ADD_DASHBOARD_USER:
        await processInviteUser(cleanData, currentUser)
        break
      default:
        break
    }
    return {
      success: true,
      isAuthen: true,
      message: 'Invite sent!',
    }
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
      error: error?.message,
    }
  }
})

export const getDomain = ({ isProduction, custom }: { isProduction?: boolean; custom?: string }) => {
  return custom || appCheck().app.options.projectId === 'carry-dev'
    ? 'https://carry-dev-dashboard.vercel.app/'
    : appCheck().app.options.projectId === 'carry-live'
    ? isProduction
      ? 'https://dashboard.carrybible.com/'
      : 'https://carry-staging-dashboard.vercel.app/'
    : 'http://localhost:3000/'
}

async function addNewUser(
  inviteData: Carry.EmailInvite,
  inviter: Carry.User,
  user: UserRecord,
  existUser?: Carry.User,
  campusData?: Carry.Campus,
) {
  // Generate stream token
  let streamToken = ''
  try {
    streamToken = Service.Stream.createToken(user?.uid)
  } catch (e) {
    logger.error(`Error creating Stream token:`, e)
  }
  let campusIds = inviteData?.target?.details?.campusId
    ? [inviteData?.target?.details?.campusId]
    : [Utils.getCampus(inviter?.organisation)?.[0]]

  campusIds = _.compact(_.uniq(campusIds))
  const campusTracking =
    campusIds?.map((x) => {
      const tracking: Carry.Tracking = {
        addToLeaderBy: inviter.uid,
        created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
        campusId: x,
        type: 'campus',
      }
      return tracking
    }) ?? []

  // Generate user profile
  const profile = {
    uid: existUser?.uid ?? user.uid,
    name: existUser?.displayName ?? existUser?.name ?? user.displayName ?? user.email,
    image: existUser?.image ?? user.photoURL ?? DEFAULT_USER_AVATAR,
    email: existUser?.email ?? user.email ?? inviteData.email,
    groups: existUser?.groups ?? [],
    visibility: existUser?.visibility ?? 'public',
    freemium: existUser?.freemium ?? true,
    organisation: {
      id: inviter?.organisation?.id || inviteData?.target?.details?.organisationId || '',
      ...(inviteData?.target?.details?.campusId
        ? {
            campusId: inviteData?.target?.details?.campusId,
            campusIds: campusIds ?? [],
          }
        : {}),
      role: inviteData?.role || 'member',
    },
    created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    streamToken: existUser?.streamToken ?? streamToken ?? '',
  }
  await firestore().collection(collections.USERS).doc(user.uid).set(profile, { merge: true })
  if (campusTracking && campusTracking.length > 0) {
    const tasks: Promise<any>[] = campusTracking.map((x) =>
      firestore()
        .collection(collections.USERS)
        .doc(user.uid)
        .collection(collections.TRACKING)
        .doc(x.campusId ?? '')
        .set(x, { merge: true }),
    )
    await Promise.all(tasks)
  }
}

async function processInviteUser(request: Request.inviteRequest, userInvite: Carry.User) {
  const org = (
    await firestore().doc(`organisations/${userInvite?.organisation?.id}`).get()
  ).data() as Carry.Organisation

  const emails = (request.emails || []).map((email) => ({ value: email, type: 'email' }))
  const uids = (request.uids || []).map((uid) => ({ value: uid, type: 'uid' }))

  for (const identity of [...emails, ...uids]) {
    const userAuth = await auth().getUsers([
      identity.type === 'uid' ? { uid: identity.value } : { email: identity.value },
    ])
    let user = userAuth?.users?.[0]

    const code = uuidv4()
    const inviteObj = {
      code: code,
      created: firestore.FieldValue.serverTimestamp(),
      updated: firestore.FieldValue.serverTimestamp(),
      ...pick(request, ['role', 'target', 'customDomain']),
      userInvite: userInvite.uid,
      accepted: false,
      email: user?.email || identity.value,
    } as Carry.EmailInvite

    let campusData: Carry.Campus | undefined = undefined
    if (inviteObj?.target?.details?.campusId && userInvite.organisation?.id) {
      campusData = (
        await firestore()
          .doc(`${collections.ORGANISATIONS}/${userInvite.organisation?.id}`)
          .collection(collections.CAMPUS)
          .doc(inviteObj?.target?.details?.campusId)
          .get()
      ).data() as Carry.Campus
    }

    if (!user) {
      const userResult = await auth().createUser({
        email: inviteObj.email,
        password: uuidv4(),
      })
      user = userResult
    } else if (inviteObj?.target?.details?.campusId && user.uid) {
      await firestore()
        .doc(`${collections.ORGANISATIONS}/${userInvite.organisation?.id}`)
        .collection(collections.CAMPUS)
        .doc(inviteObj.target.details.campusId)
        .update({
          members: firestore.FieldValue.arrayUnion(user.uid),
          memberCount: firestore.FieldValue.increment(1),
          updated: firestore.FieldValue.serverTimestamp(),
        })
    }

    const existUser = (await firestore().doc(`${collections.USERS}/${user.uid}`).get()).data() as Carry.User

    await addNewUser(inviteObj, userInvite, user, existUser, campusData)

    const projectDomain = getDomain({ isProduction: request.isProduction, custom: request.customDomain })
    const inviteLink = projectDomain + (projectDomain.endsWith('/') ? '' : '/') + 'accept-invite?accessToken=' + code

    const sendResult = await sendDashboardInvite({
      senderName: userInvite.name || '',
      orgImage:
        org.image ||
        'https://images.unsplash.com/photo-1436968188282-5dc61aae3d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTA2M3wwfDF8cmFuZG9tfHx8fHx8fHx8MTYyNTAxMDMzMA&ixlib=rb-1.2.1&q=80&w=1080',
      link: inviteLink,
      orgName: org?.name,
      receiverEmail: user?.email || identity.value,
      receiverName: user?.displayName || identity.value,
    })
    if (sendResult?.[0]?.status !== 'sent') {
      throw new Error(sendResult?.[0]?.reject_reason || '')
    }

    const newInviteRef = firestore().collection(collections.EMAIL_INVITES).doc()
    inviteObj.id = newInviteRef.id
    await newInviteRef.set(inviteObj)
  }
}

async function processInviteGroup(request: Request.inviteRequest, userInvite: Carry.User) {
  let userAuth

  const totalLength = (request.uids?.length ?? 0) + (request.emails?.length ?? 0)
  if (totalLength > 1) throw Error('Each group only have 1 leader.')
  if (totalLength === 0) throw Error('Missing data for users')

  if (request.uids?.[0] || request.emails?.[0]) {
    userAuth = await auth().getUsers([
      request.uids?.[0] ? { uid: request.uids?.[0] || '' } : { email: request.emails?.[0] || '' },
    ])
  }

  const org = (
    await firestore().doc(`organisations/${userInvite?.organisation?.id}`).get()
  ).data() as Carry.Organisation
  const newGroupRef = await firestore().collection(collections.GROUPS).doc()
  const groupData = {
    id: newGroupRef.id,
    name: request.target?.details?.name || 'Unnamed',
    hasActiveGoal: false,
    communicationType: 'group',
    owner: '',
    memberCount: 0,
    image:
      'https://images.unsplash.com/photo-1436968188282-5dc61aae3d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTA2M3wwfDF8cmFuZG9tfHx8fHx8fHx8MTYyNTAxMDMzMA&ixlib=rb-1.2.1&q=80&w=1080',
    service: 'StreamIO',
    created: firestore.FieldValue.serverTimestamp(),
    updated: firestore.FieldValue.serverTimestamp(),
    activity: 60,
    members: [] as string[],
    organisation: {
      id: userInvite.organisation?.id,
      ...(request.target?.details?.campusId ? { campusId: request.target?.details?.campusId } : {}),
    },
    timeZone: request.target?.details?.timeZone || '',
    // old stage
    isNewGroup: true,
    publicEnemy: true,
  }

  const code = uuidv4()
  const inviteObj = {
    code: code,
    created: firestore.FieldValue.serverTimestamp(),
    updated: firestore.FieldValue.serverTimestamp(),
    ...pick(request, ['role', 'customDomain']),
    target: {
      ...request.target,
      details: {
        ...request.target?.details,
        groupId: groupData.id,
      },
    },
    userInvite: userInvite.uid,
    accepted: false,
  } as Carry.EmailInvite

  const projectDomain = getDomain({ isProduction: request.isProduction, custom: request.customDomain })
  const inviteLink = projectDomain + (projectDomain.endsWith('/') ? '' : '/') + 'accept-invite?accessToken=' + code

  const prepareEmailObj = {
    senderName: userInvite.name || '',
    groupImage:
      request.target.details.imageUrl ||
      'https://images.unsplash.com/photo-1436968188282-5dc61aae3d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTA2M3wwfDF8cmFuZG9tfHx8fHx8fHx8MTYyNTAxMDMzMA&ixlib=rb-1.2.1&q=80&w=1080',
    groupName: request.target.details.name ?? '',
    link: inviteLink,
    orgName: org?.name,
    receiverEmail: '',
    receiverName: '',
  }

  const user = userAuth?.users?.[0]

  if (user?.uid) {
    // User exist, set User to be Owner or Group.
    // If user have role member, update role to 'leader'
    const userRef = firestore().collection(collections.USERS).doc(user.uid)
    const userData = (await (await userRef.get()).data()) as Carry.User

    if (userData.organisation?.id !== userInvite.organisation?.id) {
      throw new Error('Can not invite user from other Organisation')
    }

    groupData.owner = user.uid
    groupData.memberCount = 1
    groupData.members = [user.uid]
    await newGroupRef.set(groupData)

    await userRef.set(
      {
        ...(!userData.organisation?.role || userData.organisation?.role === 'member'
          ? {
              id: userInvite.organisation?.id,
              ...(userData.organisation?.campusId
                ? { campusId: userData.organisation?.campusId, campusIds: [userData.organisation?.campusId] }
                : {}),
              role: 'leader',
            }
          : {}),
        groups: firestore.FieldValue.arrayUnion(groupData?.id),
        updated: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    prepareEmailObj.receiverEmail = user.email || ''
    prepareEmailObj.link = projectDomain
    const sendResult = await sendInviteGroupLeader(prepareEmailObj)
    if (sendResult?.[0]?.status !== 'sent') {
      throw new Error(sendResult?.[0]?.reject_reason || '')
    }
    inviteObj.email = user.email || ''
    inviteObj.accepted = true
  } else {
    // New user
    await newGroupRef.set(groupData)
    const email = request.emails?.[0] || ''
    inviteObj.email = email
    prepareEmailObj.receiverEmail = email
    prepareEmailObj.receiverName = email
    const sendResult = await sendInviteGroupLeader(prepareEmailObj)
    if (sendResult?.[0]?.status !== 'sent') {
      throw new Error(sendResult?.[0]?.reject_reason || '')
    }
  }

  const newInviteRef = firestore().collection(collections.EMAIL_INVITES).doc()
  inviteObj.id = newInviteRef.id
  await newInviteRef.set({ ...inviteObj })
}

export default func_send_invite
