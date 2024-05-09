import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { Utils } from '../shared'
import { GroupPlan, UserProgress } from '../types/studyPlan'

const onUpdateGroupStudyProgress = https.onCall(
  async (
    {
      groupId,
      planId,
      blockIndex,
      step,
      offsetTimezone,
      readingTime,
    }: {
      groupId: string
      planId: string
      blockIndex: number
      step: number
      offsetTimezone?: number
      readingTime?: number
    },
    context,
  ) => {
    const uid = context.auth?.uid
    let success = false
    let message = ''

    if (!uid || !groupId || !planId || !blockIndex || !step) {
      return { success: false, message: 'Mising values' }
    }

    const reading = readingTime ? { readingTime } : {}
    /* Logic:
    // blockIndex, step, currentStep, totalStep all start from 1.

    + Check is groups/{groupId}/plans/{planId}/progress/{userId-blockIndex} is exist?
      - If it is not exist, create object with structure:
        {
          activities: [
            {
              type: 'passage' | 'question',
              isCompleted: boolean, // Save to change status of activity in preview screen
              stepCount: number, // = 1 with question, = 1 or  = verses.length
            }
          ],
          isCompleted: boolean // status of user in this block
          currentStep: number, // current step on totalStep
          totalStep: number, // sum of all step
        }
      - If exist:
        1. Update currentStep = step if currentStep < step <= totalStep.
        2. Check activities, if currentStep enought to finish an activity then update it.
        3. Count percent by sum all (currentStep/totalStep) * (100/duration) of user
        4. Update it to plan.memberProgress.[uid].percent
        5. Update member completed to block
    */
    let newUserProcessData: UserProgress
    try {
      const planRef = firestore().collection('groups').doc(groupId).collection('plans').doc(planId)
      const planData = (await planRef.get()).data() as GroupPlan

      const userProgress = firestore()
        .collection('groups')
        .doc(groupId)
        .collection('plans')
        .doc(planId)
        .collection('progress')
        .doc(`${uid}-${blockIndex}`)

      const userProgressDocRef = await userProgress.get()
      let userProgressData: UserProgress
      if (!userProgressDocRef.exists) {
        let totalStep = 0
        let totalReadingTime = 0
        const activities = planData.blocks[blockIndex - 1].activities.map((activity) => {
          let stepCount = 1
          if (activity.type === 'passage') {
            if (activity.verses && activity.verses.length > 0) {
              stepCount = activity.verses.length
            }
          }
          const progressActivity: any = {
            type: activity.type,
            isCompleted: false,
            stepCount: stepCount,
          }
          if (totalStep < step && step <= totalStep + progressActivity.stepCount) {
            // Step is going on this activity
            if (activity.type === 'passage' && readingTime) {
              progressActivity.readingTime = readingTime
              totalReadingTime += readingTime
            }
          }
          totalStep += progressActivity.stepCount
          if (step >= totalStep) progressActivity.isCompleted = true
          return progressActivity
        })
        userProgressData = {
          uid,
          blockIndex,
          activities: activities,
          isCompleted: step >= totalStep,
          currentStep: Math.min(step, totalStep),
          totalStep: totalStep,
          totalReadingTime: totalReadingTime,
          created: firestore.FieldValue.serverTimestamp(),
          updated: firestore.FieldValue.serverTimestamp(),
        }
        await userProgress.set(userProgressData)
        // If complete block, check to update streak
        if (step >= totalStep) await updateUserStreak(uid, groupId, offsetTimezone)
        newUserProcessData = userProgressData
      } else {
        const progressData = userProgressDocRef.data() as UserProgress
        if (step <= progressData.currentStep) {
          return { success: true, message: 'Already updated' }
        }

        const activities = []
        let stepSum = 0
        let totalReadingTime = 0
        for (let i = 0; i < progressData.activities.length; i++) {
          const progressActivity = { ...progressData.activities[i] }
          if (stepSum < step && step <= stepSum + progressActivity.stepCount) {
            // Step is going on this activity
            if (progressActivity.type === 'passage' && readingTime && !progressActivity.isCompleted) {
              progressActivity.readingTime = (progressActivity.readingTime || 0) + readingTime
            }
          }
          stepSum += progressActivity.stepCount
          if (step >= stepSum) progressActivity.isCompleted = true
          totalReadingTime += progressActivity?.readingTime || 0
          activities.push(progressActivity)
        }

        userProgressData = {
          uid,
          blockIndex,
          activities: activities,
          isCompleted: step >= progressData.totalStep,
          currentStep: Math.min(step, progressData.totalStep),
          totalStep: progressData.totalStep,
          totalReadingTime,
          updated: firestore.FieldValue.serverTimestamp(),
          ...reading,
        }
        // If complete block, check to update streak
        await userProgress.set(userProgressData, { merge: true })
        if (step >= progressData.totalStep) await updateUserStreak(uid, groupId, offsetTimezone)
        newUserProcessData = userProgressData
      }

      const userProgressCollection = await firestore()
        .collection('groups')
        .doc(groupId)
        .collection('plans')
        .doc(planId)
        .collection('progress')
        .where('uid', '==', uid)
        .get()

      if (userProgressCollection.empty) {
        // No document ???
        success = false
        message = 'Save progress fail'
      } else {
        let percent = 0
        let totalReadingTime = 0

        const blocks = [...planData.blocks]
        if (newUserProcessData.isCompleted) {
          blocks[newUserProcessData.blockIndex - 1].completedMembers = [
            ...(blocks[newUserProcessData.blockIndex - 1].completedMembers || []),
            newUserProcessData.uid,
          ]
        }

        userProgressCollection.forEach((doc) => {
          const docData = doc.data() as UserProgress
          percent += (docData.currentStep / docData.totalStep) * (100 / planData.duration)
          totalReadingTime += docData.totalReadingTime
        })

        if (!planData.memberProgress?.[uid]) {
          planData.memberProgress[uid] = {
            percent: percent,
            isCompleted: percent >= 100,
            totalReadingTime: totalReadingTime,
            uid,
          }
        } else {
          planData.memberProgress[uid].totalReadingTime = totalReadingTime
          planData.memberProgress[uid].percent = percent
          if (percent >= 100) {
            planData.memberProgress[uid].isCompleted = true
          }
        }
        await planRef.set(
          newUserProcessData.isCompleted
            ? { blocks, memberProgress: planData.memberProgress }
            : { memberProgress: planData.memberProgress },
          { merge: true },
        )
        success = true
        message = `Update progress of user ${uid} in group ${groupId} success`
      }
    } catch (e: any) {
      message = `Cannot update progress of user ${uid} in group ${groupId}, ${e.message}`
      success = false
      logger.error(message)
    }

    logger.info(message)
    return { success, message }
  },
)

const updateUserStreak = async (userId: string, groupId: string, userOffsetHours?: number) => {
  try {
    // Current use group offset
    if (userOffsetHours === undefined || userOffsetHours === null) return
    // Only update for new version, which have userOffsetHours

    const userRef = firestore().collection('users').doc(userId)
    const userDoc = await userRef.get()

    const groupRef = firestore().collection('groups').doc(groupId)
    const groupDoc = await groupRef.get()

    if (userDoc.exists && groupDoc.exists) {
      const userData = userDoc.data() as Carry.User

      const offsetHours = userOffsetHours

      const nowUT = Utils.parseToUserTime(new Date(), offsetHours) // UT present for User time
      const startOfTodayUT = Utils.parseToUserTime(new Date(), offsetHours)
      startOfTodayUT.setHours(0, 0, 0, 0)
      const endOfNextDaysUT = add(startOfTodayUT, { days: 1 })
      endOfNextDaysUT.setHours(23, 59, 59, 999) // Expire time is after 1 day

      const newStreak = {
        nextStreakExpireDate: Utils.parseToCorrectTimeFirebase(endOfNextDaysUT, offsetHours),
        lastStreakDate: Utils.parseToCorrectTimeFirebase(startOfTodayUT, offsetHours),
      }

      const { nextStreakExpireDate, lastStreakDate, longestStreak, currentStreak, totalStreak } = userData

      if (lastStreakDate && nextStreakExpireDate) {
        let last: any
        let next: any
        try {
          // Quick fix unknown case when date change to object
          last = lastStreakDate.toDate()
          next = nextStreakExpireDate.toDate()
        } catch (e) {
          logger.error('Error on UPDATE USERS STREAK', userId, groupId, e)
          last = new Date((lastStreakDate.seconds || 0) * 1000)
          next = new Date((nextStreakExpireDate.seconds || 0) * 1000)
        }

        // Have streak record
        const lastStreakDateUT = Utils.parseToUserTime(last, offsetHours)
        const expireDatetimeUT = Utils.parseToUserTime(next, offsetHours)

        if (lastStreakDateUT.getTime() >= startOfTodayUT.getTime()) {
          // Streak is updated, do nothing
          return
        }

        if (expireDatetimeUT.getTime() > nowUT.getTime()) {
          // Streak is not updated and still not expire. Increase streak.
          await userRef.set(
            {
              ...newStreak,
              longestStreak: (currentStreak || 0) + 1 > (longestStreak || 0) ? (currentStreak || 0) + 1 : longestStreak,
              currentStreak: (currentStreak || 0) + 1,
              totalStreak: (totalStreak || 0) + 1,
            },
            { merge: true },
          )
          return
        }

        // Not updated or Expired. setup new Streak records
        await userRef.set(
          {
            ...newStreak,
            streakStartDate: Utils.parseToCorrectTimeFirebase(startOfTodayUT, offsetHours),
            currentStreak: 1,
            totalStreak: (totalStreak || 0) + 1,
          },
          { merge: true },
        )
        return
      }

      // Completely new
      await userRef.set(
        {
          ...newStreak,
          streakStartDate: Utils.parseToCorrectTimeFirebase(startOfTodayUT, offsetHours),
          longestStreak: 1,
          currentStreak: 1,
          totalStreak: 1,
        },
        { merge: true },
      )
      return
    }
  } catch (error) {
    logger.error('Error on UPDATE USERS STREAK', userId, groupId, error)
    return
  }
}

export default onUpdateGroupStudyProgress
