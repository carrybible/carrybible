import * as admin from 'firebase-admin'
import { https, logger } from 'firebase-functions'
import { v4 as uuidv4 } from 'uuid'
import { getDomain } from '../admin/https/func_send_invite'
import { sendDashboardInvite } from '../shared/MainChimp'
import collections from '../types/collections'

const func_invite_to_org = https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  try {
    const { masterKey, orgId, emails, role, isProduction } = req.body
    const checkKey = await admin
      .firestore()
      .collection('systemSettings')
      .doc('masterApiKeys')
      .collection('masterKeys')
      .doc(masterKey)
      .get()

    if (checkKey.exists && checkKey.data()?.active) {
      // message.new
      if (!orgId || !emails || !['leader', 'campus-leader', 'admin', 'member', 'owner'].includes(role)) {
        res.json({
          success: false,
          message: 'Missing value {orgId, email , role, isProduction}',
        })
        return
      }

      // Get ORG
      const org = (await admin.firestore().doc(`organisations/${orgId}`).get()).data() as Carry.Organisation
      if (!org) {
        res.json({
          success: false,
          message: 'Org is not exist!',
        })
        return
      }

      const emailList = typeof emails === 'string' ? [emails] : emails
      const projectDomain = getDomain({ isProduction })

      for (const email of emailList) {
        const code = uuidv4()
        const urlRedirect = projectDomain + 'accept-invite?accessToken='
        const inviteLink = urlRedirect + code
        const newInviteRef = admin.firestore().collection(collections.EMAIL_INVITES).doc()
        const inviteObj: any = {
          code: code,
          created: admin.firestore.FieldValue.serverTimestamp(),
          updated: admin.firestore.FieldValue.serverTimestamp(),
          email: email,
          id: newInviteRef.id,
          role: role,
          target: {
            type: 'add-dashboard-user',
            details: {
              organisationId: orgId,
              name: org.name,
            },
          },
          userInvite: 'admin',
          accepted: false,
        }
        await newInviteRef.set({ ...inviteObj })
        const sendResult = await sendDashboardInvite({
          senderName: 'Carry Admin',
          orgImage:
            org.image ||
            'https://images.unsplash.com/photo-1436968188282-5dc61aae3d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTA2M3wwfDF8cmFuZG9tfHx8fHx8fHx8MTYyNTAxMDMzMA&ixlib=rb-1.2.1&q=80&w=1080',
          link: inviteLink,
          orgName: org?.name,
          receiverEmail: email || '',
          receiverName: email || '',
        })
        if (sendResult?.[0]?.status !== 'sent') {
          throw new Error(sendResult?.[0]?.reject_reason || '')
        }
      }

      res.json({
        success: true,
        message: 'Sent to all email!',
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
    logger.error('[CREATE ORG]', error, req.body)
    res.json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
    return
  }
})

export default func_invite_to_org
