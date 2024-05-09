import { firestore, logger } from 'firebase-functions'
import _, { pickBy, uniq } from 'lodash'
import { Service, Utils, WeeklyReviewUtils } from '../shared'
import { onUpdateUser } from '../shared/reports/syncGroupData'
import collections from '../types/collections'
import { isArrayEqual } from '../shared/Utils'

export default firestore.document('/users/{userID}').onUpdate(async (change, context) => {
  // Get some context from the Ref variables
  const { userID } = context.params
  const old = change.before.data() as Carry.User
  const user = change.after.data() as Carry.User
  await onUpdateUser(user, old, change.after.ref)
  if (old?.orgSyncStatus !== user?.orgSyncStatus) {
    // For trigger sync only
    return
  }
  const promises: Array<any> = []

  try {
    //---------
    // Update get stream IO
    let hasUpdate = false
    const update: { id: string; set: any } = { id: userID, set: {} }
    // name
    if (old.name !== user.name) {
      hasUpdate = true
      update.set.name = user.name
    }

    // image
    if (old.image !== user.image) {
      hasUpdate = true
      update.set.image = user.image
    }

    // reading
    if (old.reading !== user.reading) {
      hasUpdate = true
      update.set.reading = user.reading
    }

    // current streak
    if (old.currentStreak !== user.currentStreak) {
      hasUpdate = true
      update.set.currentStreak = user.currentStreak
      update.set.nextStreakExpireDate = user.nextStreakExpireDate
    }

    // handle to record streak change
    const dataStreak = {
      nextStreakExpireDate: user.nextStreakExpireDate || old.nextStreakExpireDate,
      lastStreakDate: user.lastStreakDate || old.lastStreakDate,
      streakStartDate: user.streakStartDate || old.streakStartDate,
      todayStreakProgress: user.todayStreakProgress || old.todayStreakProgress,
      longestStreak: user.longestStreak || old.longestStreak,
      currentStreak: user.currentStreak || old.currentStreak,
      totalStreak: user.totalStreak || old.totalStreak,
      lastForgiveDate: user.lastForgiveDate || old.lastForgiveDate,
    }
    if (
      old.nextStreakExpireDate?.valueOf() !== dataStreak.nextStreakExpireDate?.valueOf() ||
      old.lastStreakDate?.valueOf() !== dataStreak.lastStreakDate?.valueOf() ||
      old.streakStartDate?.valueOf() !== dataStreak.streakStartDate?.valueOf() ||
      old.todayStreakProgress !== dataStreak.todayStreakProgress ||
      old.longestStreak !== dataStreak.longestStreak ||
      old.currentStreak !== dataStreak.currentStreak ||
      old.totalStreak !== dataStreak.totalStreak ||
      old.lastForgiveDate?.valueOf() !== dataStreak.lastForgiveDate?.valueOf()
    ) {
      const time = new Date().toISOString()
      const streakRef = Service.Firebase.firestore()
        .collection('users')
        .doc(userID)
        .collection('streaks')
        .doc(`${time}`)
      try {
        await streakRef.set(pickBy(dataStreak, _.identity))
      } catch (error) {
        logger.error('User.onUpdate Streak Error', error)
      }
    }

    // subscription
    if (old.subscription?.active !== user.subscription?.active) {
      hasUpdate = true
      update.set.subscription = user.subscription
    }

    // organisation
    if (
      old.organisation?.id !== user.organisation?.id ||
      old.organisation?.role !== user.organisation?.role ||
      old.organisation?.campusId !== user.organisation?.campusId ||
      !isArrayEqual(old.organisation?.campusIds || [], user.organisation?.campusIds || [], true)
    ) {
      hasUpdate = true
      update.set.organisation = user.organisation
    }

    // language
    if (old.language !== user.language) {
      hasUpdate = true
      update.set.language = user.language
    }

    if (hasUpdate) promises.push(Service.Stream.partialUpdateUser(update))

    await Promise.all(promises)

    // Update streak to weekly review for every groups that this user is a member
    if (update.set.currentStreak) {
      await WeeklyReviewUtils.recordStreak({
        userId: userID,
        data: {
          streak: update.set.currentStreak,
        },
      })
    }

    if (user.organisation?.id || old.organisation?.id) {
      const orgId = user.organisation?.id || old.organisation?.id || ''
      const orgRef = Service.Firebase.firestore().collection('organisations').doc(orgId)
      const orgData = (await orgRef.get()).data() as Carry.Organisation

      if (!(orgData?.leaders || []).includes(userID) && user.organisation?.id && user.organisation?.role) {
        // Add user to leader list
        await orgRef.set(
          {
            [`${user.organisation?.role}s`]: Service.Firebase.firestore.FieldValue.arrayUnion(userID),
          },
          { merge: true },
        )
      } else if ((orgData?.leaders || []).includes(userID) && old.organisation?.role) {
        // Remove user from leader
        await orgRef.set(
          { [`${old.organisation?.role}s`]: Service.Firebase.firestore.FieldValue.arrayRemove(userID) },
          { merge: true },
        )
      }

      const campusOld = Utils.getCampus(old.organisation)
      const campusNew = Utils.getCampus(user.organisation)

      const handleUpdateCampus = async (campusId: string, type: 'add' | 'remove') => {
        const campusRef = Service.Firebase.firestore()
          .doc(`${collections.CAMPUS}/${user.organisation?.id}`)
          .collection(collections.CAMPUS)
          .doc(campusId)

        const campusData = (await campusRef.get()).data() as Carry.Campus
        let members: string[] = []

        if (type === 'add') {
          members = uniq([...(campusData.members || []), user.uid])
        }

        if (type === 'remove') {
          members = (campusData?.members || []).filter((uid) => user.uid !== uid)
        }

        await campusRef.set({ members }, { merge: true })
      }

      for (const campus of campusNew) {
        if (!campusOld?.includes(campus)) {
          await handleUpdateCampus(campus, 'add')
        }
      }

      for (const campus of campusOld) {
        if (!campusNew?.includes(campus)) {
          await handleUpdateCampus(campus, 'remove')
        }
      }
    }
  } catch (e) {
    logger.error(`Error updating profile for user ${userID}:`, e)
  }
})
