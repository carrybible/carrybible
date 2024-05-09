import * as admin from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const func_check_providers = https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  try {
    const { masterKey, uid } = req.body
    const checkKey = await admin
      .firestore()
      .collection('systemSettings')
      .doc('masterApiKeys')
      .collection('masterKeys')
      .doc(masterKey)
      .get()

    if (checkKey.exists && checkKey.data()?.active) {
      const results = await admin.auth().updateUser(uid, { emailVerified: true })

      res.json({
        success: true,
        data: results,
      })
    } else {
      res.json({
        success: false,
        message: 'masterKey is not valid',
      })
      return
    }
  } catch (error: any) {
    logger.error('[CREATE ORG]', error, req.body)
    res.json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
    return
  }
})

export default func_check_providers
