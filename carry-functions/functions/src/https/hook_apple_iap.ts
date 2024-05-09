import _ from 'lodash'
import { https, logger } from 'firebase-functions'
import { firestore } from 'firebase-admin'

const onStatusUpdate = https.onRequest(async (req, res) => {
  const { body } = req

  try {
    const originalTransactionId = _.get(body, 'unified_receipt.latest_receipt_info[0].original_transaction_id')
    const latest_receipt = _.get(body, 'unified_receipt.latest_receipt')
    const expires_date_ms = _.get(body, 'unified_receipt.latest_receipt_info[0].expires_date_ms')
    const lastest_product_id = _.get(body, 'unified_receipt.latest_receipt_info[0].product_id')
    const expires_date_ms_int = parseInt(expires_date_ms)
    const current_time_ms = new Date().valueOf()

    const auto_renew_product_id = _.get(body, 'unified_receipt.pending_renewal_info[0].auto_renew_product_id')
    const auto_renew_status = _.get(body, 'unified_receipt.pending_renewal_info[0].auto_renew_status')

    const is_active = current_time_ms < expires_date_ms_int

    const iapRef = firestore().doc(`/iap/${originalTransactionId}`)
    const iapData = (await iapRef.get()).data() || {}
    let product_id = iapData.product_id

    const {
      unified_receipt,
      bvrs,
      // auto_renew_product_id,
      // auto_renew_status ,
      auto_renew_status_change_date_ms,
      auto_renew_status_change_date_pst,
      environment,
      notification_type,
      ...rest
    } = req.body

    const { pending_renewal_info, latest_receipt_info } = unified_receipt

    // Handle update product_id for downgrade case
    if (latest_receipt_info && iapData.product_id && iapData.product_id !== lastest_product_id) {
      // latest_receipt_info have different product_id because use had subscribe to other tier.
      // Check expired time of current tier, if it expired, change to new tier
      let isFoundProductId = false
      latest_receipt_info.forEach((value: any) => {
        if (!isFoundProductId && value.product_id === iapData.product_id) {
          isFoundProductId = true
          if (value.expires_date_ms < current_time_ms) {
            // old tier is expired, update to newest tier
            product_id = lastest_product_id
          }
        }
      })
    }

    await iapRef.set(
      {
        active: is_active,
        auto_renew_product_id,
        auto_renew_status: auto_renew_status === 'true' || '1' ? true : false,
        // auto_renew_status_change_date: firestore.Timestamp.fromMillis(parseInt(auto_renew_status_change_date_ms)),
        // auto_renew_status_change_date_ms: parseInt(auto_renew_status_change_date_ms),
        environment,
        expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
        expires_date_ms: expires_date_ms_int,
        latest_receipt,
        original_transaction_id: originalTransactionId,
        notifications: firestore.FieldValue.arrayUnion({
          ...rest,
          auto_renew_product_id,
          auto_renew_status: auto_renew_status === 'true' || '1' ? true : false,
          // auto_renew_status_change_date: firestore.Timestamp.fromMillis(parseInt(auto_renew_status_change_date_ms)),
          // auto_renew_status_change_date_ms: parseInt(auto_renew_status_change_date_ms),
          notification_type,
        }),
        unified_receipt: { pending_renewal_info, latest_receipt_info },
        product_id: product_id || lastest_product_id || auto_renew_product_id || '',
      },
      { merge: true },
    )

    switch (notification_type) {
      // https://developer.apple.com/documentation/appstoreservernotifications/notification_type
      case 'CANCEL':
        break

      case 'DID_FAIL_TO_RENEW':
        break

      case 'DID_RECOVER':
      case 'DID_CHANGE_RENEWAL_PREF':
      case 'DID_CHANGE_RENEWAL_STATUS':
      case 'DID_RENEW':
      case 'INITIAL_BUY':
      case 'INTERACTIVE_RENEWAL':
        // if (userRef) {
        //   await userRef?.update({
        //     subscription: {
        //       active: is_active,
        //       auto_renew_status: auto_renew_status === 'true' || '1' ? true : false,
        //       product_id: auto_renew_product_id,
        //       expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
        //       expires_date_ms: expires_date_ms_int,
        //       original_transaction_id: originalTransactionId,
        //     },
        //   })
        // }

        break
      case 'PRICE_INCREASE_CONSENT':
        break
      case 'REFUND':
        break
      case 'REVOKE':
        // Dont handle revoke as family sharing wont be enabled
        // if (userRef) {
        //   await userRef?.update({
        //     subscription: {
        //       active: is_active,
        //       auto_renew_status: auto_renew_status === 'true' || '1' ? true : false,
        //       product_id: auto_renew_product_id,
        //       expires_date: firestore.Timestamp.fromMillis(expires_date_ms_int),
        //       expires_date_ms: expires_date_ms_int,
        //       original_transaction_id: originalTransactionId,
        //     },
        //   })
        // }
        break
    }
  } catch (error) {
    logger.error('Error on save iap', error)
  }
  res.status(200).send(true)
  return
})

// const sample_mobile_success = {
//   originalTransactionDateIOS: 1611891382000,
//   originalTransactionIdentifierIOS: '1000000771229538',
//   productId: 'dev_premium_0001',
//   transactionDate: 1612253339000,
//   transactionId: '1000000772652471',
//   transactionReceipt:
//     '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',
// }

// const sample_INTERACTIVE_RENEWAL = {
//   notification_type: 'INTERACTIVE_RENEWAL',
//   password: '2d841a18f9c6451c90065850a32e1cc6',
//   environment: 'Sandbox',
//   bvrs: '9',
//   unified_receipt: {
//     pending_renewal_info: [
//       {
//         auto_renew_product_id: 'dev_premium_0001',
//         original_transaction_id: '1000000771229538',
//         auto_renew_status: '1',
//         product_id: 'dev_premium_0001',
//       },
//     ],
//     status: 0,
//     latest_receipt_info: [
//       {
//         is_in_intro_offer_period: 'false',
//         original_purchase_date_ms: '1611891382000',
//         expires_date: '2021-02-02 08:13:59 Etc/GMT',
//         expires_date_ms: '1612253639000',
//         transaction_id: '1000000772652471',
//         quantity: '1',
//         purchase_date_ms: '1612253339000',
//         purchase_date: '2021-02-02 08:08:59 Etc/GMT',
//         is_trial_period: 'false',
//         web_order_line_item_id: '1000000059543733',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//         subscription_group_identifier: '20730599',
//         purchase_date_pst: '2021-02-02 00:08:59 America/Los_Angeles',
//         original_transaction_id: '1000000771229538',
//         product_id: 'dev_premium_0001',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         expires_date_pst: '2021-02-02 00:13:59 America/Los_Angeles',
//       },
//       {
//         original_transaction_id: '1000000771229538',
//         purchase_date_ms: '1611892976000',
//         is_in_intro_offer_period: 'false',
//         product_id: 'dev_premium_0001',
//         subscription_group_identifier: '20730599',
//         purchase_date: '2021-01-29 04:02:56 Etc/GMT',
//         original_purchase_date_ms: '1611891382000',
//         web_order_line_item_id: '1000000059543576',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//         expires_date_pst: '2021-01-28 20:07:56 America/Los_Angeles',
//         is_trial_period: 'false',
//         expires_date_ms: '1611893276000',
//         expires_date: '2021-01-29 04:07:56 Etc/GMT',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         purchase_date_pst: '2021-01-28 20:02:56 America/Los_Angeles',
//         transaction_id: '1000000771235822',
//         quantity: '1',
//       },
//       {
//         purchase_date: '2021-01-29 03:56:20 Etc/GMT',
//         expires_date: '2021-01-29 04:01:20 Etc/GMT',
//         original_purchase_date_ms: '1611891382000',
//         product_id: 'dev_premium_0001',
//         expires_date_pst: '2021-01-28 20:01:20 America/Los_Angeles',
//         purchase_date_pst: '2021-01-28 19:56:20 America/Los_Angeles',
//         original_transaction_id: '1000000771229538',
//         transaction_id: '1000000771233070',
//         is_trial_period: 'false',
//         web_order_line_item_id: '1000000059543470',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         quantity: '1',
//         expires_date_ms: '1611892880000',
//         purchase_date_ms: '1611892580000',
//         is_in_intro_offer_period: 'false',
//         subscription_group_identifier: '20730599',
//       },
//       {
//         transaction_id: '1000000771232163',
//         expires_date: '2021-01-29 03:56:20 Etc/GMT',
//         product_id: 'dev_premium_0001',
//         is_in_intro_offer_period: 'false',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         expires_date_pst: '2021-01-28 19:56:20 America/Los_Angeles',
//         purchase_date: '2021-01-29 03:51:20 Etc/GMT',
//         web_order_line_item_id: '1000000059543357',
//         purchase_date_ms: '1611892280000',
//         original_transaction_id: '1000000771229538',
//         purchase_date_pst: '2021-01-28 19:51:20 America/Los_Angeles',
//         expires_date_ms: '1611892580000',
//         subscription_group_identifier: '20730599',
//         original_purchase_date_ms: '1611891382000',
//         is_trial_period: 'false',
//         quantity: '1',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//       },
//       {
//         original_purchase_date_ms: '1611891382000',
//         expires_date_pst: '2021-01-28 19:51:20 America/Los_Angeles',
//         purchase_date_ms: '1611891980000',
//         subscription_group_identifier: '20730599',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//         is_trial_period: 'false',
//         web_order_line_item_id: '1000000059543242',
//         quantity: '1',
//         purchase_date_pst: '2021-01-28 19:46:20 America/Los_Angeles',
//         transaction_id: '1000000771231223',
//         expires_date: '2021-01-29 03:51:20 Etc/GMT',
//         product_id: 'dev_premium_0001',
//         original_transaction_id: '1000000771229538',
//         is_in_intro_offer_period: 'false',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         expires_date_ms: '1611892280000',
//         purchase_date: '2021-01-29 03:46:20 Etc/GMT',
//       },
//       {
//         expires_date_ms: '1611891980000',
//         purchase_date_ms: '1611891680000',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//         original_purchase_date_ms: '1611891382000',
//         product_id: 'dev_premium_0001',
//         original_transaction_id: '1000000771229538',
//         expires_date_pst: '2021-01-28 19:46:20 America/Los_Angeles',
//         subscription_group_identifier: '20730599',
//         quantity: '1',
//         expires_date: '2021-01-29 03:46:20 Etc/GMT',
//         is_in_intro_offer_period: 'false',
//         purchase_date_pst: '2021-01-28 19:41:20 America/Los_Angeles',
//         web_order_line_item_id: '1000000059543136',
//         transaction_id: '1000000771230394',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         is_trial_period: 'false',
//         purchase_date: '2021-01-29 03:41:20 Etc/GMT',
//       },
//       {
//         original_transaction_id: '1000000771229538',
//         product_id: 'dev_premium_0001',
//         transaction_id: '1000000771229538',
//         original_purchase_date: '2021-01-29 03:36:22 Etc/GMT',
//         is_in_intro_offer_period: 'false',
//         subscription_group_identifier: '20730599',
//         expires_date_pst: '2021-01-28 19:41:20 America/Los_Angeles',
//         expires_date: '2021-01-29 03:41:20 Etc/GMT',
//         purchase_date: '2021-01-29 03:36:20 Etc/GMT',
//         is_trial_period: 'false',
//         quantity: '1',
//         web_order_line_item_id: '1000000059543135',
//         purchase_date_pst: '2021-01-28 19:36:20 America/Los_Angeles',
//         expires_date_ms: '1611891680000',
//         original_purchase_date_ms: '1611891382000',
//         purchase_date_ms: '1611891380000',
//         original_purchase_date_pst: '2021-01-28 19:36:22 America/Los_Angeles',
//       },
//     ],
//     latest_receipt:
//       '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',
//     environment: 'Sandbox',
//   },
//   auto_renew_status: 'true',
//   auto_renew_product_id: 'dev_premium_0001',
//   bid: 'com.carrybible.wings',
// }

export default onStatusUpdate
