import { Timestamp } from '@google-cloud/firestore'
import { compareAsc, differenceInDays, differenceInWeeks } from 'date-fns'
import { appCheck, firestore, messaging } from 'firebase-admin'
import { logger } from 'firebase-functions'
import _ from 'lodash'
import { Channel } from 'stream-chat'
import { Mixpanel, Service } from '.'
import { EVENTS } from '../cronjobs/tasks/types'
import { GroupPlan } from '../types/studyPlan'
import { DURATION_DAY } from './Constants'
import { trans, TransString } from './i18n'

export function stringArrayEquals(a: Array<string>, b: Array<string>): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

const pad = (num: number, size: number) => {
  let s = String(num)
  while (s.length < (size || 2)) {
    s = '0' + s
  }
  return s
}

function getRootID(bookId: number, chapterId: number, verseId: number) {
  return parseInt(pad(bookId, 3) + pad(chapterId, 3) + pad(verseId, 3))
}

export async function retry<T>(operation: () => Promise<T> | T, delay: number = 500, times: number = 3): Promise<T> {
  try {
    return await operation()
  } catch (ex) {
    if (times > 1) {
      await wait(delay)
      return retry(operation, delay, times - 1)
    } else {
      logger.error(ex)
      throw ex
    }
  }
}

export function getPeriodNumber(createdDate: FirebaseFirestore.Timestamp, duration: string) {
  let result = 0
  if (duration === DURATION_DAY) {
    result = differenceInDays(new Date(), createdDate.toDate()) + 1
  } else {
    result = differenceInWeeks(new Date(), createdDate.toDate()) + 1
  }
  return result
}

export function wait(n: number) {
  return new Promise((resolve) => setTimeout(resolve, n))
}

export async function publishBadgeCountUpdateTask(userIds: string[], groupId: string) {
  const topic = await Service.PubSub.topic('update-badge-count')
  const [isExist] = await topic.exists()
  if (!isExist) {
    await topic.create()
  }

  await topic.publishMessage({
    json: {
      users: userIds,
      groupId,
    },
  })
}

export async function updateBadgeCountToUsers(users: { userId: string; count: number }[]) {
  await Service.Firebase.messaging().sendAll(
    users.map(({ userId, count }) => ({
      topic: userId,
      apns: {
        payload: {
          aps: {
            badge: count,
          },
        },
      },
    })),
  )
}

export function sendNotificationToUsers(users: string[], { notification, data }: { notification: any; data: any }) {
  const promises: Promise<messaging.MessagingTopicResponse>[] = []
  users.forEach((m) => {
    promises.push(
      Service.Firebase.messaging().sendToTopic(
        m,
        {
          notification: {
            ...notification,
            body: notification?.body || '',
            sound: 'default',
          },
          data: {
            ...data,
            event: data?.event || EVENTS.info,
            category: 'CARRY',
          },
        },
        { contentAvailable: true, priority: 'high' },
      ),
    )
  })

  return Promise.all(promises)
}

export const sendNotificationToUser = async (
  uid: string,
  { notification, data }: { notification: { title?: TransString; body?: TransString }; data: any },
) => {
  const user = await firestore().collection('users').doc(uid).get()
  const userData = user.data() as Carry.User
  const lang = userData.language || 'en'

  const title = trans(lang, notification.title?.key, notification.title?.options)
  const body = trans(lang, notification.body?.key, notification.body?.options)

  return Service.Firebase.messaging().sendToTopic(
    uid,
    {
      notification: {
        ...notification,
        title,
        body,
        sound: 'default',
      },
      data: {
        ...data,
        event: data?.event || EVENTS.info,
        category: 'CARRY',
      },
    },
    { contentAvailable: true, priority: 'high' },
  )
}

export const sendCollapsibleNotificationToUser = async (
  uid: string,
  collapseKey: string,
  {
    notification,
    data,
  }: {
    notification: {
      title?: TransString
      body?: TransString
      [key: string]: any
    }
    data: any
  },
) => {
  const user = await firestore().collection('users').doc(uid).get()
  const userData = user.data() as Carry.User
  const lang = userData.language || 'en'

  const title = trans(lang, notification.title?.key, notification.title?.options)
  const body = trans(lang, notification.body?.key, notification.body?.options)

  await Service.Firebase.messaging().send({
    topic: uid,
    notification: {
      ...notification,
      title,
      body,
    },
    data: {
      ...data,
      event: data?.event || EVENTS.info,
      category: 'CARRY',
    },
    android: {
      collapseKey,
      notification: {
        tag: collapseKey,
      },
    },
    apns: {
      headers: {
        'apns-collapse-id': collapseKey,
      },
    },
  })
}

export function getMaxGroup(product_id: string): number {
  let maxGroup = 0
  switch (product_id) {
    case 'tier_1_annual':
    case 'tier_1_monthly':
      maxGroup = 1
      break
    case 'tier_2_annual':
    case 'tier_2_monthly':
      maxGroup = 3
      break
    case 'tier_3_annual':
    case 'tier_3_monthly':
      maxGroup = 10
      break
  }

  return maxGroup
}

function capitalizeFirstLetter(string: string) {
  return string[0].toUpperCase() + string.slice(1)
}

function getBlockIndexOfPlan(planData: GroupPlan): number {
  if (!planData) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = planData.startDate
  const periodNo = Math.min(getPeriodNumber(startDate, planData.pace), planData.duration)
  // Start from 1
  if (compareAsc(today, startDate.toDate()) === -1) return 0 // Mean not start yet
  return periodNo
}

export const removeUndefinedParams = (obj: any) => {
  return Object.keys(obj)
    .filter(function (k) {
      return obj[k] !== null && obj[k] !== undefined
    })
    .reduce(function (acc: any, k) {
      acc[k] = obj[k]
      return acc
    }, {})
}

export async function sendMessageAndGenerateThread({
  uid,
  channel,
  question,
  plan,
  hasAttachment = true,
  startThreadDate,
  user,
  blockIndex,
}: {
  uid: string
  channel: Channel
  question: string
  plan: GroupPlan
  hasAttachment: boolean
  startThreadDate: Date
  user: any
  blockIndex: number
}): Promise<string> {
  const { message } = await retry(() =>
    //@ts-ignore
    channel.sendMessage(
      {
        text: question,
        attachments: [
          {
            showOnChat: hasAttachment,
            type: 'plan',
            planId: plan.id,
            question: question,
          },
        ],
        user: { id: uid },
        silent: true,
        hide_message: true,
        skip_push: true,
      },
      { skip_push: true },
    ),
  )

  const thread: any = {
    id: message.id,
    text: question,
    replyCount: 0,
    participantIds: [uid],
    participants: {},
    creator: { uid, name: user?.name || '', image: user?.image || '', email: user?.email || '' },
    creatorId: uid,
    type: 'plan',
    planID: plan.id,
    blockIndex,
    startDate: firestore.Timestamp.fromDate(startThreadDate),
    updated: firestore.Timestamp.fromDate(startThreadDate),
  }

  const parentMessageRef = firestore().doc(`groups/${plan.targetGroupId}/threads/${message.id}`)
  await parentMessageRef.set(thread, { merge: true })
  return message.id
}

const parseToUserTime: (date: Date, offsetHour: number) => Date = (date, offsetHour) => {
  // Return a Date have correct Time follow User Timezone (Timezone of Date will have no value, revert later)
  // To simulate User Time
  const timestamp = date.getTime()
  const offsetServer = date.getTimezoneOffset() * 60 * 1000
  const offsetTimezone = offsetHour * 60 * 60 * 1000
  return new Date(timestamp + offsetServer - offsetTimezone)
}

const parseToCorrectTime: (date: Date, offsetHour: number) => Date = (date, offsetHour) => {
  const timestamp = date.getTime()
  const offsetServer = new Date().getTimezoneOffset() * 60 * 1000
  const offsetTimezone = offsetHour * 60 * 60 * 1000
  return new Date(timestamp - offsetServer + offsetTimezone)
}

const parseToCorrectTimeFirebase: (date: Date, offsetHour: number) => Timestamp = (date, offsetHour) => {
  return Service.Firebase.firestore.Timestamp.fromDate(parseToCorrectTime(date, offsetHour))
}

const queryInSnapCollections = function (
  queries: firestore.CollectionReference | firestore.Query,
  fieldCondition: string,
  arrayCompare: any[],
) {
  const step = 10
  const end = arrayCompare.length
  const result: Promise<firestore.QuerySnapshot>[] = []
  for (let start = 0; start < end; start = start + step) {
    const tmpArray = arrayCompare.slice(start, start + step) as string[]
    const refs = queries.where(fieldCondition, 'in', tmpArray).get()
    result.push(refs)
  }
  return result
}

const getCampus = (org?: {
  campusId?: string //Default Campus, if null user is using default campus of organisation
  campusIds?: string[]
  role?: string
  id?: string
}) => {
  let result: string[] = []
  if (!org) return result
  if (org.campusId) result.push(org.campusId)
  if (org.campusIds && org.campusIds.length > 0) {
    result = [...result, ...org.campusIds]
  }
  return _.uniq(result)
}

export async function getUserMessage(orgId: string, uids?: string[]) {
  return Mixpanel.getReportCount(
    Mixpanel.genQueryEvents(Mixpanel.events.MessageEvents, {
      uids,
    }),
    [Mixpanel.selectors.Org(orgId)],
  )
}

export const isArrayEqual = (x: Array<any>, y: Array<any>, defaultValue?: boolean) => {
  try {
    const result = _(x).xorWith(y, _.isEqual).isEmpty()
    return result
  } catch (e) {
    return defaultValue || true
  }
}

export const resSuccess = (message: string, data?: any) => {
  return {
    success: true,
    message,
    data,
  }
}

export const resError = (message: string, trackParams?: any, customData?: any) => {
  logger.error(`[Track error response]`, message, trackParams)
  return {
    success: false,
    message,
    data: customData,
  }
}

export const getDashboardLink = (env?: 'local' | 'dev' | 'staging' | 'live') => {
  switch (env) {
    case 'local':
      return 'http://localhost:3000/'
    case 'dev':
      return 'https://carry-dev-dashboard.vercel.app/'
    case 'staging':
      return 'https://carry-staging-dashboard.vercel.app/'
    case 'live':
      return 'https://dashboard.carrybible.com/'
    default:
      return appCheck().app.options.projectId === 'carry-live'
        ? 'https://dashboard.carrybible.com/'
        : 'https://carry-dev-dashboard.vercel.app/'
  }
}

export const runBatchAvoidLimit = async () =>
  // type: 'create' | 'delete' | 'set' | 'update',
  // batchData: { ref: any; data: any }[] = [],
  {
    // const db = Service.Firebase.firestore()
    // const BATCH_COUNT = 250
    // let count = 0
    // for (let i = 0; i < batchData.length; i += BATCH_COUNT) {
    //   const batch = db.batch()
    //   try {
    //     batchData.slice(i, i + BATCH_COUNT).forEach(({ ref, data }) => {
    //       count++
    //       switch (type) {
    //         case 'create':
    //           batch.create(ref, data)
    //           break
    //         case 'delete':
    //           batch.delete(ref)
    //           break
    //         default:
    //           batch.set(ref, data, { merge: true })
    //           break
    //       }
    //     })
    //     await batch.commit()
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }
  }
export default {
  getRootID,
  retry,
  wait,
  getPeriodNumber,
  sendNotificationToUsers,
  sendNotificationToUser,
  sendCollapsibleNotificationToUser,
  getMaxGroup,
  capitalizeFirstLetter,
  updateBadgeCountToUsers,
  publishBadgeCountUpdateTask,
  getBlockIndexOfPlan,
  stringArrayEquals,
  sendMessageAndGenerateThread,
  parseToUserTime,
  parseToCorrectTime,
  parseToCorrectTimeFirebase,
  queryInSnapCollections,
  getCampus,
  getUserMessage,
  isArrayEqual,
}
