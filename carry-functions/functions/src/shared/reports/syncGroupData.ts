import admin, { firestore } from 'firebase-admin'
import { logger } from 'firebase-functions/v1'
import { difference, isEqual, pick, pickBy } from 'lodash'
import GroupActions from '../../types/groupAction'
import Service from '../Service'
import ScoreUtils from '../ScoreUtils'

const organisationsRef = (id: string) => firestore().collection('organisations').doc(id)
const campusRef = (id: string, orgId: string) =>
  firestore().collection('organisations').doc(orgId).collection('campuses').doc(id)
const groupRef = (id: string, orgId: string) =>
  firestore().collection('organisations').doc(orgId).collection('groups').doc(id)
const memberRef = (id: string, orgId: string) =>
  firestore().collection('organisations').doc(orgId).collection('members').doc(id)

const userRef = (id: string) => firestore().collection('users').doc(id)

const sourceGroupRef = (id: string) => firestore().collection('groups').doc(id)

const pickParams = (obj: any, params: string[]) => pickBy(pick(obj, params), (v) => v !== undefined && v !== null)

export const updateReport = async (
  sourceGroup: Carry.Group | string,
  data: any,
  prompt?: GroupActions,
  readingData?: { groupId: string; uid: string; readingTime: number },
) => {
  let groupData = sourceGroup
  if (typeof sourceGroup === 'string') {
    groupData = (await sourceGroupRef(sourceGroup).get()).data() as Carry.Group
  }

  const group = groupData as Carry.Group

  if (group && group.organisation) {
    if (readingData) {
      await ScoreUtils.recordOrgEvents({
        uid: readingData.uid,
        groupId: readingData.groupId,
        type: 'reading',
        readingMinute: readingData.readingTime,
      })
    } else {
      if (prompt) {
        await ScoreUtils.recordOrgEvents({
          uid: prompt?.creator || '',
          groupId: group.id,
          type: prompt?.type === 'prayer' ? 'prayer' : 'praise',
        })
      } else {
        await organisationsRef(group.organisation?.id).set(data, { merge: true })
      }
    }

    if (prompt?.creator) {
      await userRef(prompt?.creator).set(data, { merge: true })
    }
  }
}

export const updateOrgCount = async ({ orgId, campusId, data }: { orgId: string; campusId?: string; data: any }) => {
  await organisationsRef(orgId).set(data, { merge: true })
  if (campusId) await campusRef(campusId, orgId).set(data, { merge: true })
}

const updateObj = (key: string, value: number = 1) => ({
  [key]: admin.firestore.FieldValue.increment(value),
})

// Increase total prayer or praise: onCreate
export const addPrompt = async (prompt: GroupActions, group: Carry.Group) => {
  try {
    await updateReport(group, updateObj(prompt.type === 'prayer' ? 'totalPrayer' : 'totalPraise'), prompt)
  } catch (e) {
    logger.error('[removePrompt]', e, prompt, group)
  }
}

// Decrease total prayer or praise: onDelete
export const removePrompt = async (prompt: GroupActions, group: Carry.Group) => {
  try {
    await updateReport(group, updateObj(prompt.type === 'prayer' ? 'totalPrayer' : 'totalPraise', -1))
  } catch (e) {
    logger.error('[removePrompt]', e, prompt, group)
  }
}

// Add reading time of user to their group: onUpdate
export const addReadingTime = async (currentProgress: any, pastProgress: any, group: Carry.Group) => {
  try {
    if (
      (pastProgress?.isCompleted !== currentProgress?.isCompleted && currentProgress?.isCompleted === true) ||
      (currentProgress?.orgSyncStatus && currentProgress?.orgSyncStatus !== 'synced')
    ) {
      await updateReport(group, updateObj('totalReadingTime', currentProgress.totalReadingTime), undefined, {
        groupId: group.id,
        uid: currentProgress.uid,
        readingTime: currentProgress.totalReadingTime,
      })
      return true
    }
    return false
  } catch (e) {
    logger.error('[addReadingTime]', e, pastProgress, currentProgress, group)
    return false
  }
}

/* onUpdateUser
    if user belong to org, handle sync user data with data in org
*/
const USER_DATA_TO_SYNC = ['uid', 'name', 'email', 'phoneNumber', 'currentStreak', 'image', 'language', 'organisation']

export const onUpdateUser = async (
  user: Carry.User | undefined,
  pastData: Carry.User | undefined,
  changeRef: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>['ref'],
) => {
  const db = Service.Firebase.firestore()

  const handleLeaveOrg = async () => {
    try {
      if (pastData?.organisation?.id) {
        const ref = memberRef(pastData.uid, pastData.organisation.id)
        const refDoc = await ref.get()
        if (refDoc.exists) {
          // Remove from members
          await ref.delete()

          // Get total again
          const memberDocs = await firestore()
            .collection('organisations')
            .doc(pastData.organisation.id)
            .collection('members')
            .get()

          // Remove from org data
          await organisationsRef(pastData.organisation.id).set(
            {
              // Remove from all role to avoid wrong data
              members: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              leaders: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              'campus-users': admin.firestore.FieldValue.arrayRemove(pastData.uid),
              'campus-leaders': admin.firestore.FieldValue.arrayRemove(pastData.uid),
              admins: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              owners: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              // Update new member total
              memberCount: memberDocs.docs.length,
              updated: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          )
          const batch = db.batch()
          // Remove from all group
          const groupDocs = await firestore()
            .collection('organisations')
            .doc(pastData.organisation.id)
            .collection('groups')
            .where('members', 'array-contains', pastData.uid)
            .get()
          groupDocs.docs.forEach((groupDoc) => {
            batch.update(groupDoc.ref, {
              members: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              memberCount: admin.firestore.FieldValue.increment(-1),
              updated: firestore.FieldValue.serverTimestamp(),
            })
            batch.update(firestore().collection('groups').doc(groupDoc.id), {
              members: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              memberCount: admin.firestore.FieldValue.increment(-1),
              updated: firestore.FieldValue.serverTimestamp(),
            })
          })
          // Remove from all campus
          const campusDocs = await firestore()
            .collection('organisations')
            .doc(pastData.organisation.id)
            .collection('campuses')
            .where('members', 'array-contains', pastData.uid)
            .get()
          campusDocs.docs.forEach((campusDoc) => {
            batch.update(campusDoc.ref, {
              members: admin.firestore.FieldValue.arrayRemove(pastData.uid),
              memberCount: admin.firestore.FieldValue.increment(-1),
              updated: firestore.FieldValue.serverTimestamp(),
            })
          })
          await batch.commit()
          // Add flag to know this user already synced
          if (user?.orgSyncStatus !== 'synced') {
            await userRef(pastData.uid).set({ orgSyncStatus: 'synced' }, { merge: true })
          }
        }
      }
    } catch (e) {
      logger.error('[Error handleLeaveOrg]', pastData?.organisation?.id, pastData?.uid)
    }
  }

  try {
    if (user?.organisation?.id) {
      // Add or update user data to User Org
      const extraData: any = { updated: firestore.FieldValue.serverTimestamp() }
      const ref = memberRef(user.uid, user.organisation?.id)
      const refDoc = await ref.get()
      if (!refDoc.exists) {
        extraData.joined = firestore.FieldValue.serverTimestamp()
      }
      const newData = pickParams(user, USER_DATA_TO_SYNC)
      const lastData = pastData ? pickParams(pastData, USER_DATA_TO_SYNC) : {}
      if (!isEqual(newData, lastData) || extraData.joined) {
        // Update or create data info
        await ref.set(
          {
            ...newData,
            ...extraData,
          },
          {
            merge: true,
          },
        )
      }
      // If user not in org => Add count to org and the first campus
      if (extraData.joined)
        await updateOrgCount({
          orgId: user.organisation?.id,
          data: updateObj('memberCount', 1),
        })
      // In case
      await changeRef.set({ orgSyncStatus: 'synced' }, { merge: true })

      if (pastData?.organisation?.id) {
        if (pastData?.organisation?.id !== user?.organisation?.id) {
          // Move from other ORG => Need to clean up data of old Org
          await handleLeaveOrg()
        } else {
          // Same org with previous, check campus list
          if (!isEqual(user.organisation.campusIds, pastData.organisation.campusIds)) {
            const addedItems = difference(user.organisation.campusIds || [], pastData.organisation.campusIds || [])
            const removedItems = difference(pastData.organisation.campusIds || [], user.organisation.campusIds || [])
            const batch = db.batch()
            for (const itemId of addedItems) {
              const checkExist = await firestore()
                .collection('organisations')
                .doc(user.organisation.id)
                .collection('campuses')
                .doc(itemId)
                .get()
              const campusData = checkExist.data() as Carry.Campus
              if (checkExist.exists && !campusData.members?.includes(pastData.uid)) {
                batch.update(checkExist.ref, {
                  members: admin.firestore.FieldValue.arrayUnion(pastData.uid),
                  memberCount: admin.firestore.FieldValue.increment(1),
                  updated: firestore.FieldValue.serverTimestamp(),
                })
              }
            }

            for (const itemId of removedItems) {
              const checkExist = await firestore()
                .collection('organisations')
                .doc(user.organisation.id)
                .collection('campuses')
                .doc(itemId)
                .get()
              const campusData = checkExist.data() as Carry.Campus
              if (checkExist.exists && campusData.members?.includes(pastData.uid)) {
                batch.update(checkExist.ref, {
                  members: admin.firestore.FieldValue.arrayRemove(pastData.uid),
                  memberCount: admin.firestore.FieldValue.increment(-1),
                  updated: firestore.FieldValue.serverTimestamp(),
                })
              }
            }

            await batch.commit()
          }

          if (user.organisation.role !== pastData.organisation.role) {
            const newRole = user.organisation.role
              ? {
                  [`${user.organisation.role}s`]: admin.firestore.FieldValue.arrayUnion(user.uid),
                }
              : {}
            const removeRole = pastData.organisation.role
              ? { [`${pastData.organisation.role}s`]: admin.firestore.FieldValue.arrayRemove(user.uid) }
              : {}
            await organisationsRef(user.organisation.id).set(
              {
                ...newRole,
                ...removeRole,
              },
              { merge: true },
            )
          }
        }
      }
      return
    } else {
      await handleLeaveOrg()
    }
  } catch (e) {
    logger.error('[onUpdateUser]', e, user, pastData)
  }
}

/* onUpdateGroup
    if group belong to org, handle sync group data with data in org
*/
const GROUP_DATA_TO_SYNC = [
  'id',
  'name',
  'cid',
  'created',
  'image',
  'memberCount',
  'members',
  'owner',
  'service',
  'timeZone',
]
export const onUpdateGroup = async (
  group: Carry.Group | undefined,
  pastGroup: Carry.Group | undefined,
  changeRef: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>['ref'],
) => {
  const handleRemoveGroup = async () => {
    if (pastGroup?.organisation?.id) {
      // User leave org
      const ref = groupRef(pastGroup.id, pastGroup.organisation?.id)
      const refDoc = await ref.get()
      if (refDoc.exists) {
        await ref.delete()
        await updateOrgCount({
          orgId: pastGroup.organisation?.id,
          campusId: pastGroup.organisation?.campusId,
          data: updateObj('groupCount', -1),
        })
      }
    }
  }

  try {
    if (group?.organisation?.id) {
      let isNewGroup = false
      const extraData: any = { updated: firestore.FieldValue.serverTimestamp() }
      const ref = groupRef(group.id, group.organisation?.id)
      const refDoc = await ref.get()
      if (!refDoc.exists) isNewGroup = true
      const newData = pickParams(group, GROUP_DATA_TO_SYNC)
      const lastData = pastGroup ? pickParams(pastGroup, GROUP_DATA_TO_SYNC) : {}
      if (!isEqual(newData, lastData) || isNewGroup) {
        await ref.set(
          {
            ...newData,
            ...extraData,
          },
          {
            merge: true,
          },
        )
      }
      if (isNewGroup) {
        await updateOrgCount({
          orgId: group.organisation?.id,
          campusId: group.organisation?.campusId,
          data: updateObj('groupCount', 1),
        })
        await changeRef.set({ orgSyncStatus: 'synced' }, { merge: true })
      }
      if (pastGroup?.organisation?.id) {
        if (pastGroup?.organisation?.id !== group?.organisation?.id) {
          // Move from other ORG => Need to clean up data of old Org
          await handleRemoveGroup()
        }
      }
      return
    } else {
      await handleRemoveGroup()
    }
  } catch (e) {
    logger.error('[onUpdateGroup]', e, group, pastGroup)
  }
}

// Sync all member have orgnisation to their org
export const syncMembers = async ({ limit }: { limit: number }) => {
  try {
    const users = await firestore()
      .collection('users')
      .orderBy('organisation.id', 'desc')
      .where('organisation.id', 'not-in', [''])
      .orderBy('updated', 'asc')
      .limit(limit || 50)
      .get()
    const jobs: Promise<any>[] = []
    let count = 0
    users.forEach((doc) => {
      const data = doc.data() as Carry.User
      if (data?.uid && data?.organisation?.id && data?.orgSyncStatus !== 'synced') {
        count += 1
        jobs.push(
          doc.ref.set(
            { orgSyncStatus: `syncing-${new Date().getTime()}`, updated: firestore.FieldValue.serverTimestamp() },
            { merge: true },
          ),
        )
      }
    })
    logger.info('[syncMembers]', 'total sync', count)
    return await Promise.all(jobs)
  } catch (e) {
    logger.error('[syncMembers]', e)
  }
  return true
}

// Sync all group have orgnisation to their org
export const syncGroups = async ({ limit }: { limit: number }) => {
  try {
    const groups = await firestore()
      .collection('groups')
      .orderBy('organisation.id', 'desc')
      .where('organisation.id', 'not-in', [''])
      .orderBy('updated', 'asc')
      .limit(limit || 5)
      .get()
    const jobs: Promise<any>[] = []
    let count = 0
    for (const doc of groups.docs) {
      const data = doc.data() as Carry.Group
      if (data?.id && data?.organisation?.id && data?.orgSyncStatus !== 'synced') {
        count += 1
        jobs.push(
          doc.ref.set(
            { orgSyncStatus: `syncing-${new Date().getTime()}`, updated: firestore.FieldValue.serverTimestamp() },
            { merge: true },
          ),
        )
      }
      if (data?.orgSyncStatus !== 'synced') {
        const prompts = await firestore().collection('groups').doc(doc.id).collection('actions').get()
        for (const promptDoc of prompts.docs) {
          const promptData = promptDoc.data() as GroupActions
          if (promptData?.orgSyncStatus !== 'synced') {
            jobs.push(
              promptDoc.ref.set(
                { orgSyncStatus: `syncing-${new Date().getTime()}`, updated: firestore.FieldValue.serverTimestamp() },
                { merge: true },
              ),
            )
          }
        }
      }
    }
    logger.info('[syncGroups]', 'total sync', count)
    return await Promise.all(jobs)
    // Sync all prompt from group to org
  } catch (e) {
    logger.error('[syncGroups]', e)
  }
  return true
}
