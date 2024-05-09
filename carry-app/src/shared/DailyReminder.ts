import { RootState } from '@dts/state'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationRoot } from '@scenes/root'
import { format } from 'date-fns'
import Constants from './Constants'
import Firestore from './Firestore'
import Reminder from './Reminder'

const timeFormat = 'hh:mm a'

class DailyReminderClass {
  isLocalInit = false
  latestScreen = ''
  local: any = null
  server: any = null

  // Save state
  me: App.User | undefined
  openHomeScreenCount = 0

  updateState = async (props: { state: RootState }) => {
    if (props.state.screen.currentScreen === 'HomeTab' && this.latestScreen !== props.state.screen.currentScreen) {
      this.openHomeScreenCount += 1
    }
    this.latestScreen = props.state.screen.currentScreen || ''
    if (props.state.me?.uid && props.state.me?.streamToken && props.state.group?.id && props.state.group?.channel) {
      if (!global.reminderSynced) {
        global.reminderSynced = true
        if (!this.me) {
          this.me = props.state.me
          await this.getLocalReminder()
          await this.getServerReminder()
        }
        this.sync()
      }
    } else if (this.local || this.server || this.me) {
      // Logout or not login case
      await this.clearLocalReminder()
      this.me = undefined
      this.local = null
      this.server = null
      this.isLocalInit = false
      this.openHomeScreenCount = 0
      global.reminderSynced = false
    }
  }

  getDefaultReminder = () => {
    const now = new Date()
    now.setHours(7, 30, 0, 0)
    return { timeString: format(now, timeFormat), time: JSON.parse(JSON.stringify(now)), enabled: false, updated: 0 }
  }

  getLocalReminder = async () => {
    const reminder = await AsyncStorage.getItem('SetReminder')
    const updated = Number(await AsyncStorage.getItem('SetReminderTime'))
    const isEnableStr = await AsyncStorage.getItem('SetReminderEnable')
    if (reminder) {
      // Local reminder existed
      const reminderTime = new Date(JSON.parse(reminder))
      this.local = {
        timeString: format(reminderTime, timeFormat),
        time: JSON.parse(reminder),
        enabled: !isEnableStr ? true : isEnableStr === 'true',
        updated: updated,
      }
      return
    }
    this.local = this.getDefaultReminder()
    this.isLocalInit = true
  }

  getServerReminder = async () => {
    if (this.me?.uid && this.me?.streamToken) {
      if (this.me.reminder) {
        const updated = Number(this.me.reminder.updated)
        const timeServer = new Date(this.me.reminder.time || '')
        this.server = {
          timeString: this.me.reminder.time ? format(timeServer, timeFormat) : '',
          time: this.me.reminder.time,
          enabled: this.me.reminder.enabled,
          updated: updated,
        }
        return
      }
    }
    this.server = this.getDefaultReminder()
  }

  clearLocalReminder = async () => {
    await this.setLocalReminderData('', 0, false)
    Reminder.cancelNotification(Constants.REMINDER_NOTIFICATION_ID.toString())
  }

  setLocalReminderData = async (time: string, updated: number, enabled: boolean) => {
    await AsyncStorage.setItem('SetReminder', time)
    await AsyncStorage.setItem('SetReminderTime', `${updated}`)
    await AsyncStorage.setItem('SetReminderEnable', `${enabled}`)
  }

  activeNewReminder = value => {
    // Schedule new notification
    const scheduleDate = new Date()
    scheduleDate.setHours(value.getHours(), value.getMinutes(), 0)
    Reminder.scheduleReminder(scheduleDate, { name: this.me?.name || this.me?.displayName || 'me' })
  }

  updateLocalReminder = async (time: Date, enabled = true, updated?: number) => {
    // use params 'updated' in case sync from server to local
    const newUpdated = updated || new Date().getTime()
    await this.clearLocalReminder()
    await this.setLocalReminderData(JSON.stringify(time), newUpdated, enabled)

    this.local = {
      timeString: format(time, timeFormat),
      time: JSON.parse(JSON.stringify(time)),
      enabled: enabled,
      updated: newUpdated,
    }

    if (enabled) {
      // If new local enable reminder, set Reminder time
      this.activeNewReminder(time)
    }

    this.sync()
  }

  sync = async () => {
    if (!this.server || !this.local) return
    if (this.server.updated > this.local.updated) {
      // Server have newer data, set it to local
      this.updateLocalReminder(new Date(this.server.time), this.server.enable, this.server.updated)
      return
    }

    if (this.local.updated > this.server.updated) {
      // New update from local, sync to server
      this.server = { ...this.local }
      await Firestore.Auth.updateUser({
        reminder: this.local,
      })
      return
    }

    if (this.isLocalInit) {
      // Just login to this device
      if (this.server.updated !== 0) {
        // Have used app on the other devices or just login again
        this.isLocalInit = false
        this.updateLocalReminder(new Date(this.server.time), this.server.enable, this.server.updated)
        return
      } else {
        // Totally new, open SetReminder Screen
        if (this.openHomeScreenCount > 1) {
          this.isLocalInit = false
          NavigationRoot.navigate(Constants.SCENES.GROUP.REMINDER)
        }
        return
      }
    }
  }
}

const DailyReminder = new DailyReminderClass()

export default DailyReminder
