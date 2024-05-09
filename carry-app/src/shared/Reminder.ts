/* eslint-disable @typescript-eslint/ban-ts-comment */
import Firestore from '@shared/Firestore'
import LocalStorage from '@shared/LocalStorage'
import { add, differenceInDays, isAfter, setDay, sub } from 'date-fns'
import RNPush, { PushNotificationScheduledLocalObject } from 'react-native-push-notification'

import { StudyPlan } from '@dts/study'
import I18n from 'i18n-js'
import Constants from './Constants'
import { getDateFromFirestoreTime } from './Utils'

let instance: Reminder

// default cache: 100 seconds
const checkCompletedStudyInAllGroup = ((ttl = 100000) => {
  let cache: boolean | null = null
  let cacheTime = 0
  return async (): Promise<boolean> => {
    if (cache != null && Date.now() - cacheTime < ttl) {
      return cache
    }
    const groups = global.store?.getState().groups ?? []
    cache = await Firestore.Study.checkCompletedStudyInAllGroups(groups, false, true)
    cacheTime = Date.now()
    return cache
  }
})()

class Reminder {
  _onNotification: any
  _onRegister: any
  _timeoutId: any

  static get shared() {
    if (instance) return instance

    return new Reminder()
  }

  constructor() {
    if (!instance) {
      this.setup()

      instance = this
    }
    return instance
  }

  getScheduledLocalNotifications(callback: (notifications: PushNotificationScheduledLocalObject[]) => void) {
    RNPush.getScheduledLocalNotifications(callback)
  }

  cancelAllNotifications() {
    RNPush.cancelAllLocalNotifications()
  }

  cancelNotification(id: string) {
    RNPush.cancelLocalNotification(id)
  }

  initialNotification(handleNotification) {
    this._onNotification = handleNotification
  }

  changeReminderUserName(name: string) {
    this.cancelAllNotifications()
    this.getScheduledLocalNotifications(notis => {
      const n = notis.find(n => n.id.toString() === Constants.REMINDER_NOTIFICATION_ID.toString())

      if (n) {
        this.cancelNotification(n.id.toString())
        this.scheduleReminder(n.date, { name })
      }
    })
  }

  scheduleReminder(date: Date, { name, title }: { name?: string; title?: string }) {
    devLog('Set Reminder Notification', {
      id: Constants.REMINDER_NOTIFICATION_ID,
      date: date,
      message: I18n.t('params.Reminder message'),
      title: title ?? I18n.t('params.Reminder title', { nameValue: name }),
      userInfo: { type: 'reminder' },
      repeatType: 'day',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: 'white',
    })
    LocalStorage.saveReminderTime(undefined)
    RNPush.localNotificationSchedule({
      id: Constants.REMINDER_NOTIFICATION_ID,
      date: date,
      message: I18n.t('params.Reminder message'),
      title: title ?? I18n.t('params.Reminder title', { nameValue: name }),
      userInfo: { type: 'reminder' },
      repeatType: 'day',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: 'white',
    })

    // If user set reminder after they finished daily flow then we will temporarily cancel it
    clearTimeout(this._timeoutId)
    this._timeoutId = setTimeout(() => {
      checkCompletedStudyInAllGroup().then(finishedDailyInAllGroups => {
        devLog('Should temporarily cancel today reminder:', finishedDailyInAllGroups)
        if (finishedDailyInAllGroups) {
          this.cancelTodayScheduleReminder()
        }
      })
    }, 1000)
  }

  cancelTodayScheduleReminder() {
    this.getScheduledLocalNotifications(notis => {
      const reminderNoti = notis.find(noti => noti.id.toString() === Constants.REMINDER_NOTIFICATION_ID.toString())
      if (!reminderNoti) {
        return
      }
      const today = new Date().setHours(reminderNoti.date.getHours(), reminderNoti.date.getMinutes(), reminderNoti.date.getSeconds())

      // If already showed reminder for today --> no need to cancel
      if (isAfter(Date.now(), today)) {
        return
      }

      this.cancelNotification(reminderNoti.id)

      // Store async storage
      LocalStorage.saveReminderTime(new Date(today))
    })
  }

  scheduleStreak(me: App.User, goal: StudyPlan.GroupPlan, groupId: string) {
    RNPush.localNotificationSchedule({
      id: Constants.STREAK_NOTIFICATION_ID,
      date: new Date(Date.now() + 84600 * 1000), // 84600s = 23.5h
      message: I18n.t('params.Streak notification', { streakValue: me.currentStreak, nextValue: (me.currentStreak || 0) + 1 }),
      userInfo: {
        type: 'reminder',
        goal: goal,
        groupId: groupId,
      },
    })
  }

  scheduleWarningStreak(me: App.User, goal: StudyPlan.GroupPlan, groupId: string) {
    RNPush.localNotificationSchedule({
      id: Constants.STREAK_WARNING_NOTIFICATION_ID,
      date: new Date(Date.now() + 86400 * 1000), // 86400s = 24h
      message: I18n.t('params.Streak warning notification', { streakValue: me.currentStreak }),
      userInfo: {
        type: 'reminder',
        goal: goal,
        groupId: groupId,
      },
    })
  }

  scheduleReminderWeekAdvanced(id: number, me: App.User, goal: App.AdvancedGoal) {
    const startDate = getDateFromFirestoreTime(goal.startDate)
    const currentTime = new Date()
    startDate.setHours(currentTime.getHours())
    startDate.setMinutes(currentTime.getMinutes())
    startDate.setSeconds(currentTime.getSeconds())

    let addDate = 86400 * 1000
    let message = ''
    switch (id) {
      case Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_3:
        addDate *= 2
        message = `You're ${Math.round(goal.progress?.[me.uid] || 0)}%% through this weeks study 👏 - Take 10-minutes to keep going.`
        break
      case Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_5:
        message = `Only 1 day left to finish this weeks study! Take 10-minutes to do it now.`
        addDate *= 4
        break
      case Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_6:
        message = `Hey ${me.name} 👋 Today's the last day! Got 5-minutes to complete this weeks study?`
        addDate *= 5
        break
      default:
        break
    }
    RNPush.localNotificationSchedule({
      id: id,
      date: new Date(startDate.getTime() + addDate), // 86400s = 24h
      message: message,
      userInfo: {
        type: 'reminder',
        goal: goal,
        groupId: goal.groupId,
      },
    })
  }

  scheduleWeeklyReviewReminder(data?: { groupId: string; groupName: string; groupCreated: number }) {
    const MONDAY = 1
    this.getScheduledLocalNotifications(notis => {
      const previousWeeklyReviewNoti = notis.find(n => n.id.toString() === Constants.REMINDER_WEEKLY_REVIEW.toString())
      if (previousWeeklyReviewNoti) {
        this.cancelNotification(previousWeeklyReviewNoti.id.toString())
      }

      // Default noti time is 8 AM on every Monday
      let notiTime = setDay(new Date().setHours(8, 0, 0), MONDAY)
      const dailyReminderNoti = notis.find(n => n.id.toString() === Constants.REMINDER_NOTIFICATION_ID.toString())
      if (dailyReminderNoti) {
        notiTime = setDay(sub(dailyReminderNoti.date, { hours: 1 }), MONDAY)
      }

      if (differenceInDays(notiTime, new Date()) < 0) {
        notiTime = add(notiTime, { days: 7 })
      }

      // Update the weekly review reminder to the new time base on daily reminder time
      if (!data) {
        if (previousWeeklyReviewNoti) {
          RNPush.localNotificationSchedule({
            id: Constants.REMINDER_WEEKLY_REVIEW,
            date: notiTime,
            // @ts-ignore
            message: previousWeeklyReviewNoti.message,
            title: previousWeeklyReviewNoti.title,
            userInfo: previousWeeklyReviewNoti.data,
            repeatType: 'week',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
            color: 'white',
          })
        }
        return
      }

      const { groupId, groupCreated, groupName } = data
      if (differenceInDays(notiTime, new Date(groupCreated)) < 7) {
        notiTime = add(notiTime, { days: 7 })
      }

      RNPush.localNotificationSchedule({
        id: Constants.REMINDER_WEEKLY_REVIEW,
        date: notiTime,
        message: `Your weekly review for ${groupName} is ready for view`,
        title: 'Weekly Review',
        userInfo: {
          type: `weekly_review`,
          groupId,
        },
        repeatType: 'week',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        color: 'white',
      })
    })
  }

  scheduleFuturePlans(date: Date, name: string, groupId) {
    RNPush.localNotificationSchedule({
      id: Constants.FUTURE_PLANS_NOTIFICATON_ID + groupId,
      date: date,
      message: I18n.t('params.Future plans reminder message', { nameValue: name }),
      userInfo: { type: 'future-plans', groupId },
      smallIcon: 'ic_notification',
      largeIcon: 'ic_launcher',
      color: 'white',
    })
  }

  private async reminderHandle() {
    global.Analytics.event(Constants.EVENTS.NOTIFICATION.GOAL_REMINDER)
  }

  setup() {
    RNPush.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification: n => this._onNotification?.(n),

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       */
      requestPermissions: false,
    })
  }
}

export default Reminder.shared
