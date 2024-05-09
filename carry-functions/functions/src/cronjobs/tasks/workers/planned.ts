import { add } from 'date-fns'
import { firestore } from 'firebase-admin'
import { QueryDocumentSnapshot } from 'firebase-functions/v1/firestore'
import { identity, pick, pickBy } from 'lodash'
import { Service, Utils } from '../../../shared'
import { TransString } from '../../../shared/i18n'
import { WorkerType } from '../types'

interface PlannedWorkerType extends WorkerType {
  data: {
    plan: { day: number; title: TransString; body?: TransString; event?: string }[]
    // day should be 0,1,2, or 8 days (just example) count from start day, if missing 0, it won't
    // send notification in the first day
    startDate: FirebaseFirestore.Timestamp
  }
  currentIndex: number
  customData?: any
}

const plannedWorker = async (snapshot: QueryDocumentSnapshot, worker: PlannedWorkerType) => {
  const { data, currentIndex, uid, customData } = worker
  const { startDate, plan } = data
  const currentPlan = plan[currentIndex]
  const start = startDate.toDate()
  const nextIndex = currentIndex + 1
  const nextStatus = nextIndex > plan.length - 1 ? 'complete' : 'scheduled'
  const nextDate = add(start, { days: plan[currentIndex].day })

  return await Utils.sendNotificationToUser(uid, {
    notification: pick(currentPlan, ['title', 'body']),
    data: {
      ...(customData || {}),
      event: currentPlan.event,
    },
  })
    .then(() => {
      return snapshot.ref.update({
        performAt: firestore.Timestamp.fromDate(nextDate),
        currentIndex: Math.min(plan.length - 1, nextIndex),
        status: nextStatus,
      })
    })
    .catch((err) =>
      snapshot.ref.update({
        status: nextStatus === 'complete' ? 'error' : nextStatus,
        errorMessages: firestore.FieldValue.arrayUnion(err?.message),
      }),
    )
}

const db = Service.Firebase.firestore()

export const createPlannedWorker = (
  uid: string,
  startDate: Date,
  plan: PlannedWorkerType['data']['plan'],
  customData?: any,
) => {
  if (!uid) return
  return db.collection('tasks').add({
    uid,
    worker: 'planned',
    status: 'scheduled',
    performAt: Service.Firebase.firestore.Timestamp.fromDate(add(startDate, { days: plan[0].day })),
    data: {
      plan: pickBy(plan, identity),
      startDate: Service.Firebase.firestore.Timestamp.fromDate(startDate),
    },
    currentIndex: 0,
    ...(customData ? { customData } : {}),
  } as PlannedWorkerType)
}

export default plannedWorker
