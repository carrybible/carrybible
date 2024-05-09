import { firestore } from 'firebase-admin'
import { logger, pubsub } from 'firebase-functions'
import { getClient, getSubscriptionData } from '../shared/GoogleAPI'

const androidSubscription = pubsub.topic('android-subscriptions').onPublish(async (message, context) => {
  try {
    if (message.data) {
      const buff = Buffer.from(message.data, 'base64')
      const data = JSON.parse(buff.toString('ascii'))
      logger.info('android sub', data)

      const auth = await getClient()

      const response = await getSubscriptionData({
        auth,
        packageName: data.packageName,
        subscriptionId: data.subscriptionNotification.subscriptionId,
        token: data.subscriptionNotification.purchaseToken,
      })
      if (response.status === 200) {
        const original_transaction_id = response.data.orderId?.split('..')?.[0]
        const id = original_transaction_id

        const subscriptionId = data.subscriptionNotification.subscriptionId

        const { expiryTimeMillis, startTimeMillis } = response.data
        const expires_date_ms_int = parseInt(expiryTimeMillis || '')
        const start_date_ms_int = parseInt(startTimeMillis || '')
        const current_time_ms = new Date().valueOf()
        const is_active = current_time_ms < expires_date_ms_int

        const iapRef = firestore().doc(`/iap/${id}`)
        const iap = await iapRef.get()
        const iapData = iap.data()

        const newIapData = {
          platform: 'android',
          active: is_active,
          orderId: original_transaction_id,
          product_id: subscriptionId,
          auto_renew_status: response.data.autoRenewing,
          start_date: firestore.Timestamp.fromMillis(start_date_ms_int),
          start_date_ms: start_date_ms_int,
          expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
          expires_date_ms: expires_date_ms_int,
          histories: firestore.FieldValue.arrayUnion(response.data),
          original_transaction_id: original_transaction_id,
        }

        await iapRef.set(newIapData, { merge: true })

        if (iapData?.uid) {
          const iapCollectionRef = firestore().collection('iap')
          const snapshot = await iapCollectionRef.where('uid', '==', iapData?.uid).get()

          if (snapshot.empty) {
            logger.error('Not found any iap for', iapData?.uid)
            return
          } else {
            const iapActive: any[] = []
            let shouldPushNewIAP = newIapData.active
            snapshot.forEach((doc) => {
              const docData = doc.data()
              if (docData.orderId === newIapData.orderId) {
                if (shouldPushNewIAP) {
                  iapActive.push({ ...iapData, ...newIapData })
                  shouldPushNewIAP = false
                }
              } else if (docData.active && current_time_ms < docData.expires_date_ms) {
                iapActive.push(docData)
              }
            })

            if (shouldPushNewIAP) {
              iapActive.push({ ...iapData, ...newIapData })
              shouldPushNewIAP = false
            }

            let theBestIap: any = null
            let currentScore = 0
            iapActive.forEach((value) => {
              let score = 0
              switch (value.product_id) {
                case 'tier_1_annual':
                  score = 2
                  break
                case 'tier_1_monthly':
                  score = 1
                  break
                case 'tier_2_annual':
                  score = 4
                  break
                case 'tier_2_monthly':
                  score = 3
                  break
                case 'tier_3_annual':
                  score = 6
                  break
                case 'tier_3_monthly':
                  score = 5
                  break
              }
              if (!theBestIap || currentScore < score) {
                theBestIap = value
                currentScore = score
              }
            })

            const userRef = firestore().doc(`/users/${iapData?.uid}`)
            if (theBestIap) {
              await userRef?.update({
                subscription: {
                  platform: 'android',
                  active: theBestIap.active,
                  auto_renew_status: theBestIap.auto_renew_status,
                  product_id: theBestIap.product_id,
                  expires_date: theBestIap.expires_date,
                  expires_date_ms: theBestIap.expires_date_ms,
                  original_transaction_id: theBestIap.original_transaction_id,
                },
              })
            } else {
              await userRef?.update({
                subscription: {
                  active: false,
                },
              })
            }
          }
        }

        logger.info('SUCCESS GOOGLE EVENT PAYMENT', response, data)
      }
    } else logger.info('FAIL GOOGLE EVENT PAYMENT: MISSING ITEM')
  } catch (e) {
    logger.info('FAIL GOOGLE EVENT PAYMENT: ERROR', e)
  }
})

export default androidSubscription
