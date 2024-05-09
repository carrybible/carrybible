import { auth, firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { UserRecord } from 'firebase-functions/v1/auth'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { Service, Utils } from '../../shared'
import { DEFAULT_USER_AVATAR } from '../../shared/Constants'

import collections from '../../types/collections'
const verifyInvite = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  const { accessToken } = req.body
  logger.info('verify token', accessToken)
  if (!accessToken) {
    res.json({
      success: false,
      message: 'Invite expired!',
    })
    return
  }

  try {
    const inviteRef = (await firestore().collection(collections.EMAIL_INVITES).where('code', '==', accessToken).get())
      .docs
    if (inviteRef && inviteRef.length > 0) {
      const inviteData = inviteRef[0].data() as Carry.EmailInvite

      // Check expire or already accepted
      if (checkExpireToken(inviteData.created) || inviteData.accepted === true) {
        res.json({
          success: false,
          message: 'Invite expired!',
        })
        return
      }

      // Check email of user in system
      const searchEmail = await auth().getUsers([{ email: inviteData.email }])
      let user = searchEmail?.users?.[0]
      if (!user) {
        const searchUser = await firestore().collection(collections.USERS).where('email', '==', inviteData.email).get()
        for (const userSnap of searchUser.docs) {
          const isUserExistInAuth = await auth().getUsers([{ uid: userSnap.id }])
          if (isUserExistInAuth.users.length > 0) {
            user = isUserExistInAuth.users[0]
          }
        }
      }

      const inviter = (
        await firestore().collection(collections.USERS).doc(inviteData.userInvite).get()
      ).data() as Carry.User

      let campusData: Carry.Campus | undefined = undefined
      if (inviteData?.target?.details?.campusId && inviter.organisation?.id) {
        campusData = (
          await firestore()
            .doc(`${collections.ORGANISATIONS}/${inviter.organisation?.id}`)
            .collection(collections.CAMPUS)
            .doc(inviteData?.target?.details?.campusId)
            .get()
        ).data() as Carry.Campus
      }

      // If user not found in system then create new User Authentication
      if (!user) {
        const userResult = await auth().createUser({
          email: inviteData.email,
          password: uuidv4(),
        })
        user = userResult

        // New user must join the same organisation of inviter or follow details
        if (!inviter && !inviteData?.target?.details?.organisationId) {
          res.json({
            success: false,
            message: 'Invite invalid!',
          })
          return
        }
        const existUser = (await firestore().doc(`${collections.USERS}/${user.uid}`).get()).data() as Carry.User
        await firestore()
          .collection(collections.USERS)
          .doc(user.uid)
          .set(
            {
              uid: existUser?.uid ?? user.uid,
              name: existUser?.displayName ?? existUser?.name ?? user.displayName ?? user.email,
              image: existUser?.image ?? user.photoURL ?? DEFAULT_USER_AVATAR,
              email: existUser?.email ?? user.email ?? inviteData.email,
              groups: existUser?.groups ?? [],
              visibility: existUser?.visibility ?? 'public',
              freemium: existUser?.freemium ?? true, // if undefine mean old user
              organisation: {
                id: inviter?.organisation?.id || inviteData?.target?.details?.organisationId || '',
                ...(inviteData?.target?.details?.campusId
                  ? {
                      campusId: inviteData?.target?.details?.campusId,
                      campusIds: [inviteData?.target?.details?.campusId],
                      campusTracking: [
                        {
                          campusId: inviteData?.target?.details?.campusId ?? '',
                          createBy: inviter?.uid ?? '',
                        },
                      ],
                    }
                  : {}),
                role: inviteData?.role || 'member',
              },
              created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
              updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
            },
            { merge: true },
          )
      }

      const userData = (await (
        await firestore().collection(collections.USERS).doc(user.uid).get()
      ).data()) as Carry.User

      if (
        userData?.organisation?.id &&
        userData?.organisation?.id !== (inviter?.organisation?.id || inviteData?.target?.details?.organisationId)
      ) {
        res.json({
          success: false,
          message: 'You already in other organisation!',
        })
        return
      }

      // Handle type request
      switch (inviteData.target?.type) {
        case 'create-group':
          await createGroup(inviteData, user.uid, user.email ?? inviteData.email)
          res.json({
            success: true,
            message: 'Invite accepted ✅',
          })
          return
        case 'add-dashboard-user':
          await addNewUser(inviteData, inviter, user, userData, campusData)
          res.json({
            success: true,
            message: 'Invite accepted ✅',
          })
          return
        default:
          break
      }
    } else {
      res.json({
        success: false,
        message: 'Invite not found',
      })
      return
    }
  } catch (error: any) {
    logger.error(error)
    res.json({
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
      error: error?.message,
    })
    return
  }
})

async function createGroup(inviteData: Carry.EmailInvite, owner: string, email?: string) {
  const groupRef = firestore()
    .collection(collections.GROUPS)
    .doc(inviteData?.target?.details?.groupId || '')
  const groupData = (await groupRef.get()).data() as Carry.Group

  if (groupData) {
    await groupRef.set(
      {
        owner: owner,
        updated: firestore.FieldValue.serverTimestamp(),
        members: firestore.FieldValue.arrayUnion(owner),
      },
      { merge: true },
    )
    await firestore()
      .collection('users')
      .doc(owner)
      .set(
        {
          groups: firestore.FieldValue.arrayUnion(groupData.id),
          updated: firestore.FieldValue.serverTimestamp(),
          email: email,
        },
        { merge: true },
      )
    await firestore().collection(collections.EMAIL_INVITES).doc(inviteData.id).set(
      {
        accepted: true,
      },
      { merge: true },
    )
  } else {
    throw new Error('Group not found!')
  }
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
            campusId: inviteData?.target?.details?.campusId ?? '',
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
  let tasks: Promise<any>[] = []
  if (campusTracking && campusTracking.length > 0) {
    tasks = campusTracking.map((x) =>
      firestore()
        .collection(collections.USERS)
        .doc(user.uid)
        .collection(collections.TRACKING)
        .doc(x.campusId ?? '')
        .set(x),
    )
  }
  tasks.push(
    firestore().collection(collections.EMAIL_INVITES).doc(inviteData.id).set(
      {
        accepted: true,
      },
      { merge: true },
    ),
  )
  await Promise.all(tasks)
}

function checkExpireToken(timeToken: FirebaseFirestore.Timestamp) {
  //Expired 1 day
  const timeInvite = new Date((timeToken.seconds || 0) * 1000)
  const currentTime = new Date()
  const dateDiff = getDayDiff(timeInvite, currentTime)
  return !(dateDiff < 1) && dateDiff >= 0
}

function getDayDiff(startDate: Date, endDate: Date): number {
  const msInDay = 24 * 60 * 60 * 1000

  return (Number(endDate) - Number(startDate)) / msInDay
}

export default verifyInvite
