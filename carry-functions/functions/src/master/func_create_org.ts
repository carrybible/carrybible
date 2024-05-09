import * as admin from 'firebase-admin'
import { https, logger } from 'firebase-functions'

const func_create_org = https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  try {
    const { masterKey, name, image } = req.body
    const checkKey = await admin
      .firestore()
      .collection('systemSettings')
      .doc('masterApiKeys')
      .collection('masterKeys')
      .doc(masterKey)
      .get()

    if (checkKey.exists && checkKey.data()?.active) {
      // message.new
      if (!name) {
        res.json({
          success: false,
          message: 'Missing name of org',
        })
        return
      }

      const newOrgRef = admin.firestore().collection('organisations').doc()
      const newOrgData = {
        id: newOrgRef.id,
        groupCount: 0,
        hasPlans: false,
        image: image || '',
        memberCount: 0,
        members: [],
        name: name || '',
        subscription: {
          active: true,
        },
        totalPraise: 0,
        totalPrayer: 0,
        totalReadingTime: 0,
      }
      await newOrgRef.set(newOrgData)

      res.json({
        success: true,
        message: 'New Org Created',
        data: newOrgData,
      })
      return
    } else {
      res.json({
        success: false,
        message: 'masterKey is not valid',
      })
      return
    }
  } catch (error: any) {
    logger.error('[CREATE ORG]', error.message)
    logger.error('[CREATE ORG]', req.body)
    res.json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
    return
  }
})

export default func_create_org
