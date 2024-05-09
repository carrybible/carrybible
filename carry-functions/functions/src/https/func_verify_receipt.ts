import { config, https, logger } from 'firebase-functions'
import { firestore } from 'firebase-admin'
import axios from 'axios'
import { APPLE_SHARED_KEY } from '../shared/Constants'
import { getClient, getSubscriptionData } from '../shared/GoogleAPI'

// id: originalTransactionIdentifierIOS
const onCallVerifyReceipt = https.onCall(
  async ({ original_transaction_id, receipt, platform = 'apple', packageName, subscriptionId, token }, context) => {
    const uid = context.auth?.uid

    try {
      if (platform === 'apple') {
        const id = original_transaction_id
        const password = platform === 'apple' ? APPLE_SHARED_KEY : ''
        const iapRef = firestore().doc(`/iap/${id}`)
        const iap = await iapRef.get()
        const isCreated = iap.exists

        if (isCreated) {
          // iap is exist, check uid that match or not
          if (iap.data()?.uid && iap.data()?.uid !== uid) {
            return {
              success: false,
              message: `Your payment account is linked to another user.`,
            }
          }
        }

        const response = await axios({
          method: 'post',
          url: config().apple.hook, //'https://sandbox.itunes.apple.com/verifyReceipt',
          data: {
            'receipt-data': receipt,
            password,
          },
        })
        if (response.data.receipt) {
          const { expires_date_ms, product_id } = response.data.latest_receipt_info[0]
          const expires_date_ms_int = parseInt(expires_date_ms)
          const current_time_ms = new Date().valueOf()
          const is_active = current_time_ms < expires_date_ms_int

          await iapRef.set(
            {
              platform: 'ios',
              uid: uid,
              active: is_active,
              product_id,
              auto_renew_status: true,
              expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
              expires_date_ms: expires_date_ms_int,
            },
            { merge: true },
          )

          const subscriptionResponse = {
            platform: 'ios',
            active: is_active,
            auto_renew_status: true,
            product_id,
            expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
            expires_date_ms: expires_date_ms_int,
            original_transaction_id: original_transaction_id,
          }

          if (!isCreated) {
            // This will be handle in case CREATE iap
            const userRef = firestore().doc(`/users/${uid}`)
            await userRef?.update({
              subscription: subscriptionResponse,
            })
          }

          return {
            success: true,
            response: {
              product_id,
              platform: 'ios',
              active: is_active,
              receipt_creation_date_ms: response.data.receipt.receipt_creation_date_ms,
              transaction_id: response.data.latest_receipt_info[0],
              subscription: subscriptionResponse,
            },
          }
        }
      } else if (platform === 'android') {
        const id = original_transaction_id.split('..')?.[0]
        const iapRef = firestore().doc(`/iap/${id}`)
        const auth = await getClient()

        const response = await getSubscriptionData({
          auth,
          packageName,
          subscriptionId,
          token,
        })

        if (response.status === 200) {
          // data: {
          //     priceAmountMicros: '196000000000',
          //     priceCurrencyCode: 'VND',
          //     purchaseType: 0,
          //     acknowledgementState: 1,
          //     expiryTimeMillis: '1627101028282',
          //     developerPayload: '',
          //     autoRenewing: true,
          //     startTimeMillis: '1627100612216',
          //     kind: 'androidpublisher#subscriptionPurchase',
          //     countryCode: 'VN',
          //     paymentState: 1,
          //     orderId: 'GPA.3357-2665-5465-22762',
          //   },
          const { expiryTimeMillis, startTimeMillis, orderId } = response.data
          const expires_date_ms_int = parseInt(expiryTimeMillis || '')
          const start_date_ms_int = parseInt(startTimeMillis || '')
          const current_time_ms = new Date().valueOf()
          const is_active = current_time_ms < expires_date_ms_int

          await iapRef.set(
            {
              platform: 'android',
              uid: uid,
              active: is_active,
              orderId,
              product_id: subscriptionId,
              auto_renew_status: true,
              start_date: firestore.Timestamp.fromMillis(start_date_ms_int),
              start_date_ms: start_date_ms_int,
              expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
              expires_date_ms: expires_date_ms_int,
              histories: firestore.FieldValue.arrayUnion(response.data),
              original_transaction_id: id,
            },
            { merge: true },
          )

          // This will be handle in case CREATE iap
          // Adnroid always update because don't have single key
          const userRef = firestore().doc(`/users/${uid}`)
          const subscriptionResponse = {
            platform: 'android',
            active: is_active,
            auto_renew_status: true,
            product_id: subscriptionId,
            expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
            expires_date_ms: expires_date_ms_int,
            original_transaction_id: id,
          }
          await userRef?.update({
            subscription: subscriptionResponse,
          })

          return {
            success: true,
            response: {
              platform: 'android',
              product_id: subscriptionId,
              active: is_active,
              receipt_creation_date_ms: start_date_ms_int,
              transaction_id: response.data.orderId,
              start_date: firestore.Timestamp.fromMillis(start_date_ms_int),
              start_date_ms: start_date_ms_int,
              subscription: subscriptionResponse,
            },
          }
        }
        //Response example
        // const data = {
        //   statusText: 'OK',
        //   request: {
        //     responseURL:
        //       'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.carrybible.app/purchases/subscriptions/tier_1_monthly/tokens/nfigbelkfhldognlmmegmjbn.AO-J1OzMHgW7unWufgj05-VYwzOhk7qx63xAyUG-kfNMcZrb5p_DNPRLIpSiUVwVedv4S4a-jOvOVIWfz8MgYbrCLT3OfXwYlw',
        //   },
        //   config: {
        //     responseType: 'json',
        //     headers: {
        //       'Accept-Encoding': 'gzip',
        //       'User-Agent': 'google-api-nodejs-client/5.0.3 (gzip)',
        //       Accept: 'application/json',
        //       Authorization:
        //         'Bearer ya29.c.Kp8BCQg1amkPKPVQo7Y8QJSar7_uSZvWOcWngn-XznDRKS1q1mOgzohV6YD5JmthK5DXoQauEUyLPPssFBW0Wh2L2yes0GuBgRTTif7--fJM3cV_BcFEgtbPjhZIQXU4OxHCkdCEEdceEbHK4GzCvPgwO3eHQqWDnYr0tjmFcClvBeYbb7PK-AB8slraai7nYmT5nfvL2dClTZwpi2_Fg4tI',
        //       'x-goog-api-client': 'gdcl/5.0.3 gl-node/10.24.1 auth/7.3.0',
        //     },
        //     params: {},
        //     userAgentDirectives: [{ comment: 'gzip', product: 'google-api-nodejs-client', version: '5.0.3' }],
        //     method: 'GET',
        //     url: 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.carrybible.app/purchases/subscriptions/tier_1_monthly/tokens/nfigbelkfhldognlmmegmjbn.AO-J1OzMHgW7unWufgj05-VYwzOhk7qx63xAyUG-kfNMcZrb5p_DNPRLIpSiUVwVedv4S4a-jOvOVIWfz8MgYbrCLT3OfXwYlw',
        //     retry: true,
        //   },
        //   data: {
        //     priceAmountMicros: '196000000000',
        //     priceCurrencyCode: 'VND',
        //     purchaseType: 0,
        //     acknowledgementState: 1,
        //     expiryTimeMillis: '1627101028282',
        //     developerPayload: '',
        //     autoRenewing: true,
        //     startTimeMillis: '1627100612216',
        //     kind: 'androidpublisher#subscriptionPurchase',
        //     countryCode: 'VN',
        //     paymentState: 1,
        //     orderId: 'GPA.3357-2665-5465-22762',
        //   },
        //   status: 200,
        //   headers: {
        //     'alt-svc':
        //       'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000,h3-T051=":443"; ma=2592000,h3-Q050=":443"; ma=2592000,h3-Q046=":443"; ma=2592000,h3-Q043=":443"; ma=2592000,quic=":443"; ma=2592000; v="46,43"',
        //     'x-xss-protection': '0',
        //     'content-type': 'application/json; charset=UTF-8',
        //     'x-content-type-options': 'nosniff',
        //     'x-frame-options': 'SAMEORIGIN',
        //     server: 'ESF',
        //     vary: 'Origin, X-Origin, Referer',
        //     connection: 'close',
        //     'transfer-encoding': 'chunked',
        //     'content-encoding': 'gzip',
        //     'cache-control': 'private',
        //     date: 'Sat, 24 Jul 2021 04:23:41 GMT',
        //   },
        // }

        // throw new Error('Need check data')
        // const resource = response?.resource || {}
        // const { expiryTimeMillis, autoRenewing, startTimeMillis } = resource
        // const iapRef = firestore().doc(`/iap/${original_transaction_id}`)
        // const isCreate = !(await iapRef.get()).exists
        // const expires_date_ms_int = parseInt(expiryTimeMillis)
        // const current_time_ms = new Date().valueOf()
        // const active = current_time_ms < expires_date_ms_int
        // await iapRef.set(
        //   {
        //     uid: uid,
        //     active,
        //     auto_renew_status: autoRenewing,
        //     expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
        //     expires_date_ms: expires_date_ms_int,
        //     original_transaction_id,
        //     product_id: subscriptionId,
        //   },
        //   { merge: true },
        // )
        // if (isCreate) {
        //   // This will be handle in case CREATE iap
        //   const userRef = firestore().doc(`/users/${uid}`)
        //   await userRef?.update({
        //     subscription: {
        //       active,
        //       auto_renew_status: autoRenewing,
        //       product_id: subscriptionId,
        //       expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
        //       expires_date_ms: expires_date_ms_int,
        //       original_transaction_id,
        //     },
        //   })
        // }
        // return {
        //   success: true,
        //   response: {
        //     product_id: subscriptionId,
        //     active,
        //     receipt_creation_date_ms: startTimeMillis,
        //     transaction_id: original_transaction_id,
        //   },
        // }
      }
    } catch (e) {
      logger.error(`Error Receipt`, e, {
        original_transaction_id,
        receipt,
        platform,
        packageName,
        subscriptionId,
        token,
      })
    }
    return {
      success: false,
      message: `Error Validate Receipt`,
      data: { original_transaction_id, receipt, platform, packageName, subscriptionId, token },
    }
  },
)

export default onCallVerifyReceipt
