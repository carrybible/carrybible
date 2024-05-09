/* eslint-disable max-lines */
import { StudyPlan } from '@dts/study'
import AsyncStorage from '@react-native-async-storage/async-storage'
import auth from '@react-native-firebase/auth'
import remoteConfig from '@react-native-firebase/remote-config'
import Config from '@shared/Config'
import Reminder from '@shared/Reminder'
import { addDays, differenceInDays, differenceInWeeks, format, formatDistanceStrict, isAfter, isToday, isValid, parse, sub } from 'date-fns'
import { enGB } from 'date-fns/locale'
import _, { chunk } from 'lodash'
import md5 from 'md5'
import { Animated, Dimensions, Platform } from 'react-native'
import { Channel } from 'stream-chat'
import Constants, { DEFAULT_CONFIGS } from './Constants'
import { Campaign } from '../dts/campaign'

const X_WIDTH = 414
const X_HEIGHT = 896
const FUTURE_PLANS_NOTIFICATON_ID = 9900
const { height: D_HEIGHT, width: D_WIDTH } = Dimensions.get('window')

export const isIphoneXSMax = () => {
  if (Platform.OS === 'web') return false
  return Platform.OS === 'ios' && D_HEIGHT >= X_HEIGHT && D_WIDTH >= X_WIDTH
}

export function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}

function cutText(text, maxLength) {
  return typeof text === 'string' && typeof maxLength === 'number' && text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function HSLToHex(h, s, l) {
  s /= 100
  l /= 100

  // eslint-disable-next-line prefer-const
  let c = (1 - Math.abs(2 * l - 1)) * s,
    // eslint-disable-next-line prefer-const
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    // eslint-disable-next-line prefer-const
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }
  // Having obtained RGB, convert channels to hex
  r = Math.round((r + m) * 255).toString(16)
  g = Math.round((g + m) * 255).toString(16)
  b = Math.round((b + m) * 255).toString(16)

  // Prepend 0s, if necessary
  if (r.length == 1) r = '0' + r
  if (g.length == 1) g = '0' + g
  if (b.length == 1) b = '0' + b

  return '' + r + g + b
}

export function calculateGoalStatusFromDate(flag = 'normal', fromDate, toDate) {
  if (flag === 'ended') return 'ended'

  const today = new Date()

  // today.setHours(0, 0, 0, 0)
  const startDate = getDateFromFirestoreTime(fromDate)
  const endDate = getDateFromFirestoreTime(toDate)
  // if (!startDate?.toDate) {
  //   startDate = fromDate
  //   endDate = toDate
  // } else {
  //   startDate = fromDate.toDate()
  //   endDate = toDate.toDate()
  // }

  let status: App.GoalStatus = 'ended'

  if (isAfter(today, startDate)) {
    if (isAfter(endDate, today)) {
      status = 'ongoing'
    } else {
      status = 'ended' // ended
    }
  } else {
    status = 'upcoming' // upcoming
  }
  //status = statuses.START
  return status
}

export function stringToHexColor(str, s = 70, l = 50) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  let h = hash % 360
  if (h < 0) h = 360 + h
  return HSLToHex(h, s, l)
}

export function uiAvatarFromString(str) {
  const url = `https://ui-avatars.com/api/?name=${str}&bold=true&background=${stringToHexColor(str)}&color=ffffff&size=256&&font-size=0.33`
  return url
}

export function convertToArray(obj, shouldShift = false, sortBy) {
  const arr = []
  _.each(obj, value => {
    arr.push(value)
  })
  const sortedArray = [..._.chain(arr).sortBy(sortBy).reverse().values()]
  if (shouldShift === true) sortedArray.shift()
  return sortedArray
}

export function mergeResults(peopleResults, spaceResults, userID, spaces) {
  const mergedPeople = peopleResults.hits
    .map(person => {
      for (const space of spaces) {
        const members = Object.values(space.state.members).filter(member => member.user.id !== userID)

        // If there are only two members in the space and it's a 'personal' space then merge
        if (members.length === 1 && space.data.spaceType === 'personal' && members[0].user.id === person.id) {
          const mergedPerson = Object.assign(_.clone(space), person)
          mergedPerson.channelID = space.data.id

          return mergedPerson
        }
      }

      return person
    })
    .filter(item => item.id !== userID)

  // Map people to spaces
  const merged = [
    ...spaceResults
      .concat(mergedPeople)
      .reduce((m, item) => {
        let id = item.id

        if (item && item.state) {
          // If there are only two members in the space then change the ID to the other member's ID
          const members = Object.values(item.state.members).filter(member => member.user.id !== userID)
          const spaceName = item.data.name ? item.data.name : members[0].user.name
          item.data.name = spaceName
          if (members.length === 1 && item.data.spaceType === 'personal') id = members[0].user.id
        }

        const currMapItem = m.get(id)
        if (!currMapItem || (currMapItem && !currMapItem.channelID)) return m.set(id, item)
        return m
      }, new Map())
      .values(),
  ]

  return merged
}

export function generateAvatarStateFromMention(mention, theme) {
  return {
    key: mention.id || mention.data.id,
    theme,
    type: mention.data.id.includes('!members') || mention.data.id.includes('private') ? 'direct' : 'group',
    hasCustomImage: mention.data ? mention.data.hasCustomImage || false : true,
    customImageURL: mention.data ? mention.data.image : mention.picture ? mention.picture : '',
    members: mention.data ? Object.values(mention.state.members).map(member => member.user) : [],
    creator: { image: mention.data ? mention.data.created_by.image : mention.picture },
    size: 38,
  }
}

export function calcItemJourneyLayout(item, itemHeight) {
  let length = item.left.length * itemHeight
  if (item.left.length === item.right.length) {
    length += 55 // have item right's margin
  } else {
    length += 20
  }
  return length
}

export function replaceAt(input, start, oldStr, newStr) {
  return input.slice(0, start) + newStr + input.slice(start + oldStr.length, input.length)
}

export function replaceAtPosition(input, start, end, newStr) {
  return input.slice(0, start) + newStr + input.slice(end, input.length)
}

/**
 * Send error to Crashlytics
 * @param {Error} err
 * @param {string} event
 * @param {Object} attributes Extra attributes to include with the error report
 */
function sendError(err: any, event?: string, attributes?: any) {
  devLog('SEND ERROR', err, event, attributes)
  // Remove crashlytics
  // if (event) crashlytics().log(event)
  // if (attributes) crashlytics().setAttributes(attributes)
  // crashlytics().recordError(err)
}

/**
 * Send error to Crashlytics
 * @param {Error} err
 * @param {string} event
 */
function logEvent(event: string) {
  // Remove crashlytics
  // if (event) {
  //   crashlytics().log(event)
  // }
}

export function dirtySession(session) {
  let dirty = false
  if (!session || !session.app) return dirty
  const lastSaved = session.app.savedAt

  if ((!lastSaved && session.app.updatedAt - session.app.startedAt >= 30000) || (lastSaved && lastSaved < session.app.updatedAt))
    dirty = true

  return dirty
}

export const RegExYoutube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i //  eslint-disable-line
export const RegExVimeo =
  /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i //  eslint-disable-line
const pad = (num, size) => {
  let s = String(num)
  while (s.length < (size || 2)) {
    s = '0' + s
  }
  return s
}

export const getRootID = (bookId: number, chapterId: number, verseId: number) => {
  return parseInt(pad(bookId, 3) + pad(chapterId, 3) + pad(verseId, 3))
}

export const getDateFromFirestoreTime = time => {
  if (time instanceof Date) return time
  if (time === undefined || time._seconds === undefined) {
    return new Date()
  }
  const dateInMillis = time._seconds * 1000
  const date = new Date(dateInMillis)
  return date
}

export const getNumberFromString = input => {
  let hash = 0,
    // eslint-disable-next-line prefer-const
    len = input.length
  for (let i = 0; i < len; i++) {
    //hash = (hash << 5) - hash + input.charCodeAt(i)
    //hash |= 0 // to 32bit integer
    hash += input.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export const getFirstDayOfStreakChecklist = (me: App.User) => {
  const coef = Math.floor((me.currentStreak || 0) / 5)
  return addDays(getDateFromFirestoreTime(me.streakStartDate), 5 * coef)
}

export const getNotificationIdReminder = (goalId: string, groupId: string, periodNumber: any) => {
  let groupNumber = getNumberFromString(groupId)
  let goalNumber = getNumberFromString(goalId)
  if (groupNumber < 0) {
    groupNumber = -groupNumber
  }
  if (goalNumber < 0) {
    goalNumber = -goalNumber
  }
  const notificationId = parseInt(groupNumber.toString() + goalNumber.toString() + periodNumber)
  return notificationId
}

export function getPeriodNumber(d: Date, duration: string) {
  let result = 0
  if (duration === 'day') {
    result = differenceInDays(new Date(), d) + 1
  } else {
    result = differenceInWeeks(new Date(), d) + 1
  }
  return result
}

export function wait(n: number) {
  return new Promise(resolve => setTimeout(resolve, n))
}

export async function retry<T>(operation: () => Promise<T> | T, delay = 500, times = 3): Promise<T> {
  try {
    return await operation()
  } catch (ex) {
    if (times > 1) {
      await wait(delay)
      return retry(operation, delay, times - 1)
    } else {
      throw ex
    }
  }
}

export function getStreaChecklList(user: App.User) {
  const lastCompletedDay = getDateFromFirestoreTime(user.lastStreakDate)
  const firstDate = getDateFromFirestoreTime(user.streakStartDate)
  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const dataChecklist = [] as any
  const streakPeriod = Math.abs(differenceInDays(firstDate, lastCompletedDay))
  const startShowStreakDate = addDays(lastCompletedDay, -4)

  for (let i = 0; i < 5; i++) {
    const date = addDays(streakPeriod > 4 ? startShowStreakDate : firstDate, i)
    const streak = {
      day: format(date, 'ccccc', { locale: global.locale }),
      isToday: isToday(date),
      completed: user.currentStreak != 0 ? lastCompletedDay.getTime() >= date.getTime() : false,
    }
    dataChecklist.push(streak)
  }

  return dataChecklist
}

export function sortMember(users: Array<any>, uid: string) {
  const a = _.find(users, u => u.user.id === uid)
  const today = new Date()
  const theRest = _.filter(users, u => u.user.id !== uid).map(u => {
    if (u.user.nextStreakExpireDate) {
      const expiredDate = getDateFromFirestoreTime(u.user.nextStreakExpireDate)
      if (isAfter(today, expiredDate)) return { ...u, user: { ...u.user, currentStreak: 0 } }
    }
    return u
  })

  const sortedRest = theRest.sort((a, b) => {
    const streakB = b.user.currentStreak || 0
    const streakA = a.user.currentStreak || 0
    const nameA = a.user.name || 'Z'
    const nameB = b.user.name || 'Z'

    // if (a.user.id === uid) return 999
    if (streakB === streakA) return nameA.localeCompare(nameB)
    return streakB - streakA
  })
  if (a !== undefined) {
    return [a, ...sortedRest]
  } else {
    return sortedRest
  }
}

function fadeIn(duration: number, opacity: Animated.Value | Animated.ValueXY, delay = 0) {
  return Animated.timing(opacity, {
    toValue: 1,
    duration: duration,
    useNativeDriver: true,
    delay: delay,
  })
}

function zoom(duration: number, scale: Animated.Value | Animated.ValueXY, delay = 0) {
  return Animated.timing(scale, {
    duration: duration,
    toValue: 1,
    useNativeDriver: true,
    delay: delay,
  })
}

function moveUp(duration: number, translateY: Animated.Value | Animated.ValueXY, delay = 0) {
  return Animated.timing(translateY, {
    toValue: 0,
    duration: duration,
    useNativeDriver: true,
    delay: delay,
  })
}

export function isEmptyValues(value) {
  return (
    value === undefined ||
    value === 'undefined' ||
    value === null ||
    value === 'null' ||
    value === isNaN ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}

export function getPeriodAndroid(value: string, returnType: 'month' | 'year' | 'day' | 'week' | 'default' = 'month') {
  let periodByDay = 0
  if (!value || value.length < 3) return { value: 0, type: '' }
  switch (value[2]) {
    case 'W':
      if (returnType === 'default') return { value: parseInt(value[1]), type: 'week' }
      periodByDay = parseInt(value[1]) * 7
      break
    case 'D':
      if (returnType === 'default') return { value: parseInt(value[1]), type: 'day' }
      periodByDay = parseInt(value[1])
      break
    case 'M':
      if (returnType === 'default') return { value: parseInt(value[1]), type: 'month' }
      periodByDay = parseInt(value[1]) * 30
      break
    case 'Y':
      if (returnType === 'default') return { value: parseInt(value[1]), type: 'year' }
      periodByDay = parseInt(value[1]) * 365
      break
  }

  switch (returnType) {
    case 'month':
      return { value: periodByDay / 30, type: 'month' }
    case 'year':
      return { value: periodByDay / 365, type: 'year' }
    case 'week':
      return { value: periodByDay / 7, type: 'week' }
    case 'day':
      return { value: periodByDay, type: 'day' }
    default:
      return { value: 0, type: '' }
  }
}

export function getBlockIndexOfPlan(planData: StudyPlan.GroupPlan): {
  blockIndex: number
  isOverdue: boolean
} {
  if (!planData)
    return {
      blockIndex: 0,
      isOverdue: false,
    }
  const blockDuration = planData.pace === 'week' ? 86400000 * 7 : 86400000
  const today = new Date()
  const todayTimestamp = today.getTime()
  const startDate = getDateFromFirestoreTime(planData.startDate)
  const startTimestamp = startDate.getTime()
  if (todayTimestamp >= startTimestamp) {
    // Already started
    return {
      blockIndex: Math.min(Math.floor((todayTimestamp - startTimestamp) / blockDuration) + 1, planData.duration),
      isOverdue: Math.floor((todayTimestamp - startTimestamp) / blockDuration) + 1 > planData.duration,
    }
  } else {
    // Not start yet
    return {
      blockIndex: 0,
      isOverdue: false,
    }
  }
}

export function getChannelIdForPrivateChatInGroup(groupId: string, members: string[]): string {
  const ids = members.sort()
  const id = `${ids[0]}${ids[1]}`
  return `private${md5(id)}group${groupId}`
}

export const delay = (ms: number): Promise<string> => {
  return new Promise(resolve => setTimeout(() => resolve('ok'), ms))
}

export function formatToDistance(createdAt: string): string {
  let distance = createdAt
  const formatDate = parse(createdAt, 'MM/dd/yyyy', new Date())
  if (!isNaN(formatDate.getTime())) {
    distance = formatDistanceStrict(formatDate, new Date())
  } else {
    const formatTime = parse(createdAt, 'hh:mm a', new Date())
    if (!isNaN(formatTime.getTime())) {
      distance = formatDistanceStrict(formatTime, new Date())
    }
  }
  distance =
    distance
      .replace('years', 'y')
      .replace('year', 'y')
      .replace('months', 'm')
      .replace('month', 'm')
      .replace('days', 'd')
      .replace('day', 'd')
      .replace('hours', 'h')
      .replace('hour', 'h')
      .replace('minutes', 'm')
      .replace('minute', 'm')
      .replace('seconds', 's')
      .replace('second', 's')
      .replace(' ', '') + ' ago'
  return distance
}

type ConfigType = typeof DEFAULT_CONFIGS

export const getConfig = <K extends keyof ConfigType>(key: K): any => {
  const data = remoteConfig().getValue(String(key))
  devLog('remoteConfig', data)
  if (!data) {
    return JSON.parse(DEFAULT_CONFIGS[key])
  }
  try {
    return JSON.parse(data.asString())
  } catch (error) {
    return JSON.parse(DEFAULT_CONFIGS[key])
  }
}

const checkScheduleFuturePlan = async (planRef, group: App.Group) => {
  const planDocs = (await planRef?.get())?.docs.map(i => i.data())
  const hasFuturePlans = planDocs?.some(i => i.status === 'future')
  if (!hasFuturePlans) {
    const scheduleDateTime = sub(getDateFromFirestoreTime(group.activeGoal?.endDate), {
      days: 1,
      hours: 6,
    })
    Reminder.scheduleFuturePlans(scheduleDateTime, group.name, group.id)
  } else {
    Reminder.cancelNotification(FUTURE_PLANS_NOTIFICATON_ID + group.id)
  }
}

export function formatCodeInput(code) {
  const codeArr = chunk(code.replace(/[^a-zA-Z0-9]/g, ''), 3).map(chunkItem => chunkItem.join(''))
  const newCode = codeArr.reduce((pre, val, index) => {
    return index === 0 ? val : index === 1 ? `${pre}-${val}` : `${pre}${val}`
  }, '')
  if (code.length === 3) return `${newCode}-`
  return newCode.toUpperCase()
}

function getYoutubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

function getRandomValueByChange(data: { chance: number }[]): any {
  if ((data || []).length === 0) {
    return undefined
  }
  const total = data.reduce((pre, cur) => pre + cur.chance, 0)
  const random = Math.random() * total
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i].chance
    if (random <= sum) {
      return data[i]
    }
  }
}

function formatPhoneNumber(phoneNumberString) {
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phoneNumberString
}

async function generateSilentMessage(channel: Channel<any>, followUpPromptText: string): Promise<string> {
  const user = auth().currentUser
  const { message } = await channel.sendMessage(
    {
      text: followUpPromptText,
      user: { id: user?.uid || '' },
      silent: true,
      hide_message: true,
    },
    { skip_push: true },
  )
  return message.id
}

function possessive(string) {
  if (string === '') {
    return string
  }
  const lastChar = string.slice(-1)
  const endOfWord = lastChar.toLowerCase() === 's' ? Constants.APOSTROPHE_CHAR : `${Constants.APOSTROPHE_CHAR}s`
  return `${string}${endOfWord}`
}

export const checkAppSpeed = tag => {
  const time = new Date().getTime()
  devLog('SPEED UP ----------', tag, time - (global.time || 0))
  global.time = time
}

export const isLegacyBible = (
  me: App.User,
  translation: { remote: Array<App.Translation>; downloaded: { [key: string]: number } },
): boolean => {
  return !me.translationId && translation.remote.map(i => i.abbr).includes(me?.translation || '')
}

export const getCountryISO639 = (iso2: string): string => {
  const countries = {
    en: 'eng',
    es: 'spa',
    de: 'deu',
    fr: 'fra',
    nl: 'nld',
    da: 'dan',
    it: 'ita',
    pt: 'por',
    id: 'ind',
    ru: 'rus',
    sv: 'swe',
    uk: 'ukr',
    he: 'heb',
    vi: 'vie',
  }
  return countries[iso2] || null
}

export const variants: <T>(variantConfigs: Partial<Record<'carry', T>>, defaultValue: T) => T = (variantConfigs, defaultValue) => {
  const value = variantConfigs[Config.VARIANT]
  if (value) {
    return value
  }
  return defaultValue
}

export const isValidEmail = (email: string) => {
  return email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    )
}

export const checkShowedDayIntro = async (plan: any, blockIndex: any): Promise<boolean> => {
  const showedArrJson = await AsyncStorage.getItem('DayIntroShowed')
  const showedArr = (showedArrJson && JSON.parse(showedArrJson)) || []
  return showedArr.includes(`${plan.id}-${blockIndex}`)
}

export const isValidDate = (date: string, format = 'MM/yy') => {
  const parsedDate = parse(date, format, new Date(), { locale: enGB })
  return isValid(parsedDate)
}

function isNumeric(str: string) {
  if (typeof str !== 'string') return false // only process strings!
  return !isNaN(str) && !isNaN(parseFloat(str))
}

export const getRealGivingStatus = (camp: Campaign) => {
  // TODO: Handle cronjob to update status of campaign.
  const currentTime = new Date().getTime()
  if (camp?.status === 'active') {
    if (camp?.endDate && new Date(camp.endDate).getTime() > currentTime) return 'active'
    else return 'ended'
  } else if (camp?.status === 'ended') {
    return 'ended'
  }
  return 'ended'
}

export const roundNumber = (num: number) => {
  return Math.round(num * 100) / 100
}

export default {
  getPeriodNumber,
  calculateGoalStatusFromDate,
  getRootID,
  getDateFromFirestoreTime,
  sendError,
  cutText,
  dirtySession,
  uiAvatarFromString,
  logEvent,
  getRandomInt,
  getNumberFromString,
  wait,
  retry,
  getPeriodAndroid,
  getBlockIndexOfPlan,
  animations: {
    fadeIn,
    zoom,
    moveUp,
  },
  getChannelIdForPrivateChatInGroup,
  checkScheduleFuturePlan,
  formatCodeInput,
  getYoutubeVideoId,
  getRandomValueByChange,
  formatPhoneNumber,
  generateSilentMessage,
  possessive,
  isValidEmail,
  isNumeric,
  roundNumber,
}
