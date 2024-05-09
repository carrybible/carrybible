import AsyncStorage from '@react-native-async-storage/async-storage'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import differenceInHours from 'date-fns/differenceInHours'

export const SUGGEST_QUESTIONS = '@SuggestQuestion'
export const PREVIEW_GOAL_INTRO = '@ViewPreviewGoalIntroduction'
export const ONBOARDING_STATE = '@StateOnboarding'
export const SEARCH_HISTORY = '@SearchHistory'
export const ENABLE_NOTIFICATION = '@EnableNotification'
export const OPEN_TIME = '@OpenTime'
export const LAST_GOAL = 'LastGoal'

export const LAST_DISPLAY_WELCOME_BACK = '@LastDisplayWelcomeBack'
export const LAST_DISPLAY_SET_READING = '@LastDisplaySetReading'
export const LAST_DISPLAY_SHARE_GROUP = '@LastDisplayShareGroup'
export const TAKE_SURVEY_STATUS = '@TakeSurveyStatus'
export const ASKED_NOTIFICATION = '@AskedNotification'

export const LAST_DISPLAY_WEEKLY_REVIEW = '@LastDisplayWeeklyReview'
export const LAST_DISPLAY_LEADER_REVIEW = '@LastDisplayLeaderReview'

export const VIDEO_VIEWED = '@VideoViews'
export const REMINDER_TIME = '@ReminderTime'

let lastOpenApp: Date | null = null

if (__DEV__) {
  setTimeout(() => {
    // @ts-ignore
    console.tron?.onCustomCommand?.('Clear AsyncStorage: ' + Date.now(), () => {
      AsyncStorage.clear()
    })
    // @ts-ignore
    console.tron?.onCustomCommand?.('Pop: ' + Date.now(), () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@scenes/root').NavigationRoot.pop()
    })
  }, 100)
}

const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    devWarn('Save data error', e)
  }
}

const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue ? JSON.parse(jsonValue) : null
  } catch (e) {
    devWarn('Get data error', e)
    return null
  }
}

const storeValue = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, value)
  } catch (e) {
    devWarn('Save data error', e)
  }
}

const getValue = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key)
    return value
  } catch (e) {
    devWarn('Save data error', e)
  }
}

export interface HistoryType {
  groups: string
  people: string
  group: string
  user: string
}

export interface HistoryProps {
  text: string
  type: keyof HistoryType
  id?: string
  image?: string
}

const addSearchHistory = async (props: HistoryProps) => {
  const data = (await getData(SEARCH_HISTORY)) || []
  const newDataId = props.id || props.text
  let isRemoved = false
  const newData = data.filter(value => {
    if (value.id === newDataId) {
      isRemoved = true
      return false
    } else {
      return value
    }
  })
  newData.unshift({ ...props, id: newDataId })
  if (newData.length > 20 && !isRemoved) newData.pop()
  await storeData(SEARCH_HISTORY, newData)
}

const saveOnboardingState = async (screen: string, params: any, isReset = false, isReplace = false) => {
  const saveData = await getData(ONBOARDING_STATE)
  const currentStack = isReset ? [] : saveData?.stack || []
  if (isReplace) {
    await storeData(ONBOARDING_STATE, {
      stack: currentStack.map(value => {
        if (value.name === screen) {
          return {
            name: screen,
            params: params,
          }
        } else {
          return value
        }
      }),
    })
  } else {
    const checkExist = currentStack.reduce((ls, current) => {
      if (!ls) return false
      if (current.name === screen) {
        return false
      } else return true
    }, true)
    if (checkExist) {
      await storeData(ONBOARDING_STATE, {
        stack: [
          ...currentStack,
          {
            name: screen,
            params: params,
          },
        ],
      })
    }
  }
}

const saveOnboardingStateScreen = (screenName: string, params = {}): void => {
  storeData(ONBOARDING_STATE, { screenName, params })
}

const getOnboardingStateScreen = async () => {
  try {
    return await getData(ONBOARDING_STATE)
  } catch (error) {
    return null
  }
}

const clearStateOnboarding = async () => {
  await storeData(ONBOARDING_STATE, {})
}

const saveTime = async (customKey = OPEN_TIME) => {
  const date = new Date()
  try {
    await AsyncStorage.setItem(customKey, format(date, 'yyyy-MM-dd HH:mm:ss'))
  } catch (e) {
    devWarn('Save open app time error', e)
  }
}

const getDifferenceInHours: (customKey?: string) => Promise<number> = async (customKey = OPEN_TIME) => {
  try {
    const time = await AsyncStorage.getItem(customKey)
    if (!time) {
      saveTime(customKey)
      return -1 // Mean not save yet
    }
    const old_time = parse(time, 'yyyy-MM-dd HH:mm:ss', new Date())
    return differenceInHours(old_time, new Date())
  } catch (e) {
    devWarn('get difference error', e)
    return -1
  }
}

const getLastOpenAppDistance = async () => {
  try {
    const time = await AsyncStorage.getItem(OPEN_TIME)
    let old_time = new Date()
    if (time) old_time = parse(time, 'yyyy-MM-dd HH:mm:ss', new Date())
    if (!lastOpenApp) lastOpenApp = old_time
    saveTime()
    return differenceInHours(lastOpenApp, new Date()) || 0
  } catch (e) {
    devWarn('get last open error', e)
  }
}

const saveReminderTime = async (date: Date | undefined) => {
  if (!date) {
    await AsyncStorage.removeItem(REMINDER_TIME)
    return
  }
  await AsyncStorage.setItem(REMINDER_TIME, date.getTime().toString())
}

const getReminderTime = async (): Promise<Date | null> => {
  try {
    const reminderTime = await AsyncStorage.getItem(REMINDER_TIME)
    if (!reminderTime) {
      return null
    }
    return new Date(parseInt(reminderTime))
  } catch (e) {
    return null
  }
}

export default {
  saveOnboardingState,
  saveOnboardingStateScreen,
  getOnboardingStateScreen,
  clearStateOnboarding,
  storeData,
  storeValue,
  getData,
  getValue,
  addSearchHistory,
  saveTime,
  getDifferenceInHours,
  getLastOpenAppDistance,
  saveReminderTime,
  getReminderTime,
  keys: {
    SUGGEST_QUESTIONS,
    PREVIEW_GOAL_INTRO,
    ONBOARDING_STATE,
    SEARCH_HISTORY,
    ENABLE_NOTIFICATION,
    LAST_GOAL,
    LAST_DISPLAY_SHARE_GROUP,
    LAST_DISPLAY_WELCOME_BACK,
    LAST_DISPLAY_SET_READING,
    TAKE_SURVEY_STATUS,
    ASKED_NOTIFICATION,
    VIDEO_VIEWED,
  },
}
