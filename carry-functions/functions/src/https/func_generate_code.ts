import { firestore } from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import Hashids from 'hashids'
import { Service } from '../shared'

const db = Service.Firebase.firestore()

const onGenerateCode = https.onCall(async (params, context) => {
  const uid = context.auth?.uid || ''
  return await genInviteCode(params, uid)
})

export const genInviteCode = async (
  params: {
    groupId?: string
    organisationId?: string
  },
  uid?: string,
) => {
  let success = false
  let message = 'Cannot generate code'
  let data: any = {}
  try {
    // Check code already have for group
    if (params?.groupId) {
      const codeOfGroup = await db.collection('codes').where('groupId', '==', params.groupId).get()
      if (!codeOfGroup.empty && codeOfGroup.docs.length > 0) {
        data = codeOfGroup.docs[0].data()
        success = true
        message = `Get code success for Group!`
      }
    }

    // Check code already have for organisation
    if (params?.organisationId) {
      const codeOfOrganisation = await db.collection('codes').where('organisationId', '==', params.organisationId).get()
      if (!codeOfOrganisation.empty && codeOfOrganisation.docs.length > 0) {
        data = codeOfOrganisation.docs[0].data()
        success = true
        message = `Get code success for Organisation!`
      }
    }

    if (!success) {
      // Generate new code
      const hashids = new Hashids('Carry-sand')
      let code = ''
      let isUnique = false
      while (!code && !isUnique) {
        const now = String(new Date().getTime())
        code = hashids.encode(now.slice(now.length - 10, now.length - 2)).toUpperCase()
        const codeRef = db.doc(`/codes/${code}`)
        const codeDoc = await codeRef.get()
        if (!codeDoc.exists) {
          isUnique = true
          data = {
            ...params,
            code,
            created: firestore.FieldValue.serverTimestamp(),
            updated: firestore.FieldValue.serverTimestamp(),
          }
          if (uid) data.creator = uid
          await codeRef.set(data)
          success = true
          message = `Generate code success!`
        }
      }
    }
  } catch (e: any) {
    message = `Cannot generate code, ${e.message}`
    success = false
    logger.error(message)
  }

  return { success, message, data }
}

export default onGenerateCode
