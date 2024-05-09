import * as functions from 'firebase-functions'
import { Service } from '../shared'
import { removeUndefinedParams } from '../shared/Utils'

const db = Service.Firebase.firestore()

const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '1GB',
}

const scheduledFunctionUpdateGroupAcitivity = functions
  .runWith(runtimeOpts)
  .pubsub.schedule('0 * * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const batches: any[] = []
    batches.push(db.batch())
    let currentBatchIdx = 0
    let batchCount = 0

    const subscriptions = await db.collection('iap').where('expires_date_ms', '<=', new Date().valueOf()).get()

    subscriptions.forEach((sub) => {
      const batch = batches[currentBatchIdx]
      const data = sub.data()

      // Update active status
      batch.set(sub.ref, { active: false }, { merge: true })

      const newData = {
        active: false,
        product_id: data.auto_renew_product_id || data.product_id, // Android don't have auto_renew_product_id
        original_transaction_id: sub.id,
      }
      // Update groups and user subscription
      let userRef
      if (data?.uid) {
        userRef = db.doc(`/users/${data?.uid}`)
        batch.set(userRef, { subscription: removeUndefinedParams(newData) }, { merge: true }) // userRef.set({ subscription }, { merge: true })
        batchCount += 1
      }

      // Update groups
      if (data.premiumGroupIds) {
        data.premiumGroupIds.forEach((gid: string) => {
          const gRef = db.doc(`/groups/${gid}`)
          batch.set(gRef, { subscription: removeUndefinedParams(newData) }, { merge: true })
          batchCount += 1
        })
      }
      // messageSent: number; goalCompleted: number; score: number

      if (batchCount > 300) {
        batches.push(db.batch())
        currentBatchIdx++
        batchCount = 0
      }
    })

    batches.forEach(async (batch) => await batch.commit())
  })

export default scheduledFunctionUpdateGroupAcitivity
