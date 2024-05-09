import { Platform } from 'react-native'
import RNPush from 'react-native-push-notification'
import BadgeAndroid from 'react-native-android-badge'
import messaging from '@react-native-firebase/messaging'
import Storage from '@react-native-async-storage/async-storage'
import auth from '@react-native-firebase/auth'

import StreamIO from './StreamIO'
import Emitter from './Emitter'

let instance: Notification

class Notification {
  _fcmToken?: string
  _uid?: string
  initialNotificationMessage = null

  static get shared() {
    if (instance) return instance

    return new Notification()
  }

  constructor() {
    if (!instance) {
      instance = this
    }
    return instance
  }

  async init() {
    if (auth().currentUser?.uid) {
      this._uid = auth().currentUser?.uid
    }

    if (this._uid) {
      try {
        this._fcmToken = (await Storage.getItem('@fcm')) || ''
        if (!this._fcmToken) {
          await this.getToken()
        }
        await this.subscribeTopics()
      } catch (e) {
        devWarn('Notification', e)
      }

      /*
       * Triggered for data only payload in background
       */
      messaging().onNotificationOpenedApp(noti => {
        Emitter.emit('onNotificationOpened', { ...noti })
      })

      /*
       * Refresh token listener
       */
      messaging().onTokenRefresh(async fcmToken => {
        await Storage.setItem('@fcm', fcmToken)
        // Remove old token from device list
        if (this._fcmToken) await StreamIO.client.removeDevice(this._fcmToken, this._uid)

        // Add new token to device list
        this._fcmToken = fcmToken
        await StreamIO.client.addDevice(this._fcmToken, 'firebase', this._uid!)
      })

      return true
    } else {
      return false
    }
  }

  async getToken() {
    try {
      const fcmToken = await messaging().getToken()
      await Storage.setItem('@fcm', fcmToken)
      this._fcmToken = fcmToken
    } catch (e) {
      devWarn('Device Token exception', this._fcmToken)
    }
  }

  async hasPermission() {
    const authStatus = await messaging().hasPermission()
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL
  }

  async requestPermission(shouldSyncToken = false) {
    const authStatus = await messaging().requestPermission()
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL

    return enabled
  }

  getInitialNotification = async () => {
    // Check whether an initial notification is available
    const remoteMessage = await messaging().getInitialNotification()
    if (remoteMessage) {
      return remoteMessage
    }
    return undefined
  }

  async subscribeTopics() {
    if (this._fcmToken) {
      await messaging().subscribeToTopic('public')
      if (this._uid) {
        await messaging().subscribeToTopic(this._uid)
        await StreamIO.client.addDevice(this._fcmToken, 'firebase', this._uid)
      }
    }
  }

  async unsubscribeTopics() {
    if (this._fcmToken) {
      await messaging().unsubscribeFromTopic('public')
      if (this._uid) await messaging().unsubscribeFromTopic(this._uid)
      try {
        await StreamIO.client.removeDevice(this._fcmToken, this._uid)
      } catch (e) {
        devLog('unsubscribeTopics error', e)
        // ignore error
      }
      await Storage.removeItem('@fcm')
      this._fcmToken = undefined
    }
  }

  setBadgeCount = (count: number) => {
    if (Platform.OS === 'ios') {
      RNPush.setApplicationIconBadgeNumber(count)
    } else {
      BadgeAndroid.setBadge(count)
    }
  }
}

export default Notification.shared
