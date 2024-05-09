import { firestore, logger } from 'firebase-functions'
import _ from 'lodash'
import { Service, Utils } from '../shared'
import { removeUndefinedParams } from '../shared/Utils'

const db = Service.Firebase.firestore()

export default firestore.document('/iap/{transactionId}').onUpdate(async (change, context) => {
  const { transactionId } = context.params
  const nVal = change.after.data() // nextValue
  const pVal = change.before.data() // prevValue
  try {
    if (
      pVal.expires_date_ms !== nVal.expires_date_ms ||
      pVal.auto_renew_status !== nVal.auto_renew_status ||
      pVal.product_id !== nVal.product_id ||
      (pVal.premiumGroupIds || []).length !== (nVal.premiumGroupIds || []).length
    ) {
      const current_time_ms = new Date().valueOf()
      const is_active = current_time_ms < nVal.expires_date_ms

      // subscription info
      const subscription = removeUndefinedParams({
        platform: pVal.platform || (pVal.original_transaction_id?.includes('GPA.') ? 'android' : 'ios'),
        active: is_active,
        auto_renew_status: nVal.auto_renew_status,
        product_id: nVal.product_id,
        expires_date: nVal.expires_date,
        expires_date_ms: nVal.expires_date_ms,
        original_transaction_id: transactionId,
      })

      // Downgrade and upgrade handle
      let groupIds = nVal.premiumGroupIds
      const disableGroupIds: [string?] = []
      if (nVal.premiumGroupIds && pVal.product_id !== nVal.product_id) {
        const groupMax = Utils.getMaxGroup(nVal.product_id)
        // Downgrade
        if (nVal.premiumGroupIds.length > groupMax) {
          nVal.premiumGroupIds.forEach((groupID: string, idx: number) => {
            if (idx >= groupMax) {
              disableGroupIds.push(groupID)
            }
          })
          groupIds = _.slice(nVal.premiumGroupIds, 0, groupMax)
        }
      }

      // Update user data
      // - subscription
      // - premiumGroupIds
      let userRef
      if (nVal?.uid) {
        userRef = db.doc(`/users/${nVal?.uid}`)
        await userRef.set({ subscription, premiumGroupIds: groupIds }, { merge: true })
      }

      // Update subscription to active
      if (groupIds) {
        const batch = db.batch()
        groupIds.forEach((gid: string) => {
          const gRef = db.doc(`/groups/${gid}`)
          batch.set(gRef, { subscription }, { merge: true })
        })

        // remove license of disbalbe groups to make a simple flow
        disableGroupIds.forEach((gid?: string) => {
          const gRef = db.doc(`/groups/${gid}`)
          batch.set(gRef, { subscription: {} }, { merge: true })
        })
        await batch.commit()
      }

      return change.after.ref.set({ active: is_active }, { merge: true })
    }
  } catch (e) {
    logger.error(`Error updating iap ${transactionId}:`, e)
  }
  return Promise.resolve()
})
