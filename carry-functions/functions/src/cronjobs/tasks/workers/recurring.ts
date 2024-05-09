import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { logger } from 'firebase-functions/v1'
import { identity, pick, pickBy } from 'lodash'
import { Service, Utils } from '../../../shared'
import { TransString } from '../../../shared/i18n'
import { WorkerType } from '../types'

interface RecurringWorkerType extends WorkerType {
  data: {
    title: TransString
    body?: TransString
    event?: string

    // For repeat every 3 days or 2 weeks (7 days) or 1 month (30 days) after startDay
    interval: number
    pace: 'day' | 'week' | 'month'
  }
  customData: any
}

const days = {
  day: 1,
  week: 7,
  month: 30,
}

const recurringWorker = async (snapshot: QueryDocumentSnapshot, worker: RecurringWorkerType) => {
  const { data, performAt, uid, customData } = worker
  const { event, interval, pace } = data
  const start = performAt.toDate()
  const nextDate = add(start, { days: days[pace] * interval })

  return await Utils.sendNotificationToUser(uid, {
    notification: pick(data, ['title', 'body']),
    data: {
      ...(customData || {}),
      event,
    },
  })
    .then(() => {
      return snapshot.ref.update({
        performAt: firestore.Timestamp.fromDate(nextDate),
      })
    })
    .catch((err) => {
      logger.error('Recurring Error', snapshot.id, err)
    })
}

const db = Service.Firebase.firestore()

export const createRecurringWorker = (
  uid: string,
  performAt: Date,
  data: RecurringWorkerType['data'],
  customData?: any,
) => {
  if (!uid) return
  return db.collection('tasks').add({
    uid,
    worker: 'recurring',
    status: 'scheduled',
    performAt: Service.Firebase.firestore.Timestamp.fromDate(performAt),
    data: pickBy(data, identity),
    ...(customData ? { customData } : {}),
  } as RecurringWorkerType)
}

export default recurringWorker
