import Config from '@shared/Config'
import Firebase, {
  reInitFirebaseFunctionAfterLogin,
} from '@shared/Firebase/index'
import { wait } from '@shared/Utils'
import axios from 'axios'
import {
  browserLocalPersistence,
  EmailAuthProvider,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  linkWithCredential,
  signInWithEmailLink,
  signInWithPopup,
  unlink,
  User,
} from 'firebase/auth'

const EMAIL_FOR_LOGIN_KEY = 'EMAIL_FOR_LOGIN'
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

export const sendEmailLoginLink = async (
  email: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.post(`${Config.SERVER}/func_login_email`, {
    email,
    customUrl: `${Config.DOMAIN}/login?stage=opening-dashboard`,
  })
  const { success, message } = response.data as {
    success: boolean
    message: string
  }
  if (success) {
    window.localStorage.setItem(EMAIL_FOR_LOGIN_KEY, email)
    return {
      success: true,
    }
  }

  return {
    success,
    message,
  }
}

export const unlinkAccount = async () => {
  await signInWithPopup(Firebase.auth, googleProvider)
  if (Firebase.auth.currentUser) {
    await unlink(Firebase.auth.currentUser, EmailAuthProvider.PROVIDER_ID)
  }
}

export const linkExistedAccount = async ({
  email,
  methods,
}: {
  email: string
  methods: string[]
}): Promise<User | undefined> => {
  const credential = EmailAuthProvider.credentialWithLink(
    email,
    window.location.href
  )

  try {
    if (methods.includes(GoogleAuthProvider.PROVIDER_ID)) {
      await signInWithPopup(Firebase.auth, googleProvider)
    } else if (methods.includes(FacebookAuthProvider.PROVIDER_ID)) {
      await signInWithPopup(Firebase.auth, facebookProvider)
    } else {
      throw new Error(`Not supported providers ${methods}`)
    }
  } catch (error: any) {
    console.log('Social Login Failed', error)
    return
  }

  if (!Firebase.auth.currentUser) {
    console.log('Failed to get current user')
    return
  }
  try {
    const { user } = await linkWithCredential(
      Firebase.auth.currentUser,
      credential
    )
    return user
  } catch (error) {
    console.log('Link Account Failed', error)
    return
  }
}

export const verifyLoginLink = async ({
  confirmEmail,
  confirmLinkAccount,
  setStatusMessage,
}: {
  confirmEmail: () => Promise<string | null>
  confirmLinkAccount: (data: {
    email: string
    methods: string[]
  }) => Promise<User | undefined>
  setStatusMessage: (message: string) => void
}): Promise<{
  success: boolean
  message?: string
  data?: {
    uid?: string
    email: string
  }
}> => {
  if (!isSignInWithEmailLink(Firebase.auth, window.location.href)) {
    return {
      success: false,
      message: 'login.not-login-link',
    }
  }

  let email = window.localStorage.getItem(EMAIL_FOR_LOGIN_KEY)
  if (!email) {
    email = await confirmEmail()
  }

  if (!email) {
    return {
      success: false,
      message: 'login.cant-confirm-email',
    }
  }

  const methods = await fetchSignInMethodsForEmail(Firebase.auth, email)

  const isNeedToLink =
    methods.length > 0 &&
    !methods.includes(EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD) &&
    !methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)

  if (isNeedToLink) {
    const user = await confirmLinkAccount({ email, methods })
    if (user) {
      return {
        success: true,
        data: {
          uid: user.uid,
          email,
        },
      }
    } else {
      setStatusMessage('login.link-existed-account-failed')
      await wait(1000)
      return {
        success: false,
      }
    }
  }

  try {
    await Firebase.auth.setPersistence(browserLocalPersistence)
    const { user } = await signInWithEmailLink(
      Firebase.auth,
      email,
      window.location.href
    )
    await reInitFirebaseFunctionAfterLogin()
    return {
      success: true,
      data: {
        uid: user.uid,
        email,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      data: {
        email,
      },
    }
  }
}
