import * as admin from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import { Utils, Service } from '../../shared'
import { sendLoginAppLink, sendLoginLink } from '../../shared/MainChimp'

/*
 * This function will generate magic login link and to email for both Dashboard login and App login
 * */
const send_link_sign_in = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onRequest(async (req, res) => {
  const auth = admin.auth()
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  const { email, customUrl, customData, appName } = req.body as {
    email: string
    customUrl: string
    customData?: Record<string, any>
    // Only for app login through magic link
    appName?: string
  }
  const result = {
    message: `This email address doesn't have access to this app.`,
    success: false,
  }
  const isLoginForApp = !!appName

  try {
    if (!email) {
      res.json(result)
      logger.error('Missing email', email)
      return
    }
    const searchEmail = await auth.getUsers([{ email }])
    let existAuth: any = searchEmail?.users?.[0]

    // Only check exist auth for dashboard login
    if (!isLoginForApp) {
      if (!existAuth) {
        const searchUser = await admin.firestore().collection('users').where('email', '==', email).get()
        for (const userSnap of searchUser.docs) {
          const user = userSnap.data() as Carry.User
          if (
            user?.organisation &&
            ['admin', 'owner', 'campus-leader', 'campus-user', 'leader'].includes(user?.organisation?.role || '')
          ) {
            const isUserExistInAuth = await auth.getUsers([{ uid: user.uid }])
            if (isUserExistInAuth.users.length > 0) {
              existAuth = user
            }
          }
        }
      }

      if (!existAuth) {
        res.json(result)
        logger.error('[LOGIN WITH EMAIL]', 'Not found auth', email)
        return
      }
    }

    let username = ''
    let orgName = ''
    if (existAuth) {
      let masterRole = false
      const userRef = await admin.firestore().doc(`/users/${existAuth.uid}`).get()
      const userData = userRef.data() as Carry.User
      if (userData.organisation?.role === 'admin' || userData.organisation?.role === 'owner') masterRole = true

      if (
        !isLoginForApp &&
        (!userData?.organisation ||
          !['admin', 'owner', 'campus-leader', 'campus-user', 'leader'].includes(userData?.organisation?.role || '') ||
          (Utils.getCampus(userData.organisation).length <= 0 && !masterRole))
      ) {
        res.json(result)
        logger.error('[LOGIN WITH EMAIL]', 'Have no role', email)
        return
      }

      const orgRef = await admin.firestore().doc(`/organisations/${userData.organisation?.id}`).get()
      const orgData = orgRef.data() as Carry.Organisation

      username = userData?.name || ''
      orgName = orgData?.name || ''
    }

    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: customUrl ?? 'https://localhost:3000',
      // This must be true when login in app
      handleCodeInApp: isLoginForApp,
      ...(customData || {}),
    }

    const inviteLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings)

    const sendResult = isLoginForApp
      ? await sendLoginAppLink(username, orgName, inviteLink, email, appName)
      : await sendLoginLink(username, orgName, inviteLink, email)

    if (sendResult?.[0]?.status === 'sent') {
      result.success = true
      result.message = 'Send successful!'
      res.json(result)
      return
    } else {
      throw new Error(sendResult?.[0]?.reject_reason || '')
    }
  } catch (error: any) {
    logger.error('[LOGIN WITH EMAIL]', error, email)
    result.message = 'Server Error'
    res.json(result)
  }
})

export default send_link_sign_in
