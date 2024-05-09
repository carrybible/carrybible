import Toast from '@components/Toast'
import appleAuth from '@invertase/react-native-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import firebase from '@react-native-firebase/app'
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import axios from 'axios'
import I18n from 'i18n-js'
import { Alert } from 'react-native'
import { AccessToken, GraphRequest, GraphRequestManager, LoginManager } from 'react-native-fbsdk-next'
import { Config } from '..'
import Notification from '../Notification'
import Reminder from '../Reminder'

async function getCurrentUser(credential?: FirebaseAuthTypes.AuthCredential, name = '', email?: string) {
  try {
    if (credential && !auth().currentUser) {
      // If user cancel the process, return undefined
      if (!credential.secret && !credential.token) return undefined

      // Generate credentials
      const authCredential = await auth().signInWithCredential(credential)

      const user = auth().currentUser
      if (authCredential.additionalUserInfo?.isNewUser && name !== '') {
        await updateUser({ name: name, email }, user?.uid)
      }
      if (!user?.email && authCredential?.additionalUserInfo?.profile?.email)
        await updateUser({ email: authCredential.additionalUserInfo?.profile.email }, user?.uid)
      return user
    }
    return auth().currentUser
  } catch (e: any) {
    // User login other providers with the same email with existed Google provider
    if (e.code === 'auth/account-exists-with-different-credential') {
      const email = await getEmailFromCredential(credential)
      if (!email) {
        throw e
      }
      const providers = await auth().fetchSignInMethodsForEmail(email)
      if (!providers.includes('google.com')) {
        throw e
      }
      const success = await confirmLinkGoogleAccount(email, credential!)
      if (success) {
        return auth().currentUser
      }
    }
    throw e
  }
}

const getEmailFromCredential = async (credential?: FirebaseAuthTypes.AuthCredential): Promise<string | undefined> => {
  let email: string | undefined
  if (credential?.providerId === 'facebook.com') {
    email = await new Promise<string | undefined>(resolve => {
      const infoRequest = new GraphRequest('/me?fields=email', undefined, (error, result) => {
        if (error) {
          resolve(undefined)
          return
        }

        resolve(result?.email as string)
      })
      new GraphRequestManager().addRequest(infoRequest).start()
    })
  }
  // if (credential?.providerId === 'apple.com') {
  //   email = ''
  // }

  return email
}

const confirmLinkGoogleAccount = async (email: string, prevCredential: FirebaseAuthTypes.AuthCredential) => {
  const isConfirm = await new Promise(resolve => {
    Alert.alert(
      I18n.t('text.Link accounts'),
      I18n.t('text.Link accounts description', {
        appNameValue: Config.APP_NAME,
        emailValue: email,
      }),
      [
        {
          text: I18n.t('text.Cancel'),
          onPress: () => resolve(false),
          style: 'cancel',
        },
        { text: 'OK', onPress: () => resolve(true) },
      ],
    )
  })
  if (!isConfirm) {
    return
  }

  const googleCredential = await getGoogleCredential()
  const authCredential = await auth().signInWithCredential(googleCredential)
  try {
    await authCredential.user.linkWithCredential(prevCredential)
  } catch (e) {
    console.error(e)
    toast.error(I18n.t('text.link account failed'))
  }

  return true
}

async function updateUser(data: any, uid?: string) {
  try {
    const userId = uid || auth().currentUser?.uid
    if (!userId) return { success: false, message: 'User not found!' }

    const networkStatus = await NetInfo.fetch()

    if (networkStatus.isConnected) {
      await firestore()
        .collection('users')
        .doc(userId)
        .set({ ...data, updated: firestore.FieldValue.serverTimestamp() }, { merge: true })
      return { success: true }
    } else {
      return { success: false, message: 'Please reconnect\nto internet!' }
    }
  } catch (e) {
    devWarn('Error at update user', e)
    return { success: false, message: 'Can not update user' }
  }
}

async function getGoogleCredential() {
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/plus.me',
    ],
    webClientId: firebase.app().options.androidClientId,
    iosClientId: firebase.app().options.clientId,
  })
  await GoogleSignin.hasPlayServices()
  const userInfo: any = await GoogleSignin.signIn()
  const getToken = await GoogleSignin.getTokens()
  const credential = auth.GoogleAuthProvider.credential(userInfo.idToken, userInfo.accessToken || getToken.accessToken)
  return credential
}

async function googleLogin() {
  try {
    const credential = await getGoogleCredential()
    return await getCurrentUser(credential)
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      devWarn('SIGN_IN_CANCELLED', error)
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      devWarn('IN_PROGRESS', error)
      // operation (e.g. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      devWarn('PLAY_SERVICES_NOT_AVAILABLE', error)
      // play services not available or outdated
    } else {
      devWarn('GoogleLogin', error)
      // some other error happened
    }
    throw error
  }
}

async function getFacebookCredential() {
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email'])
  if (result.isCancelled) {
    throw new Error()
    return
  } else {
    const data = await AccessToken.getCurrentAccessToken()
    if (!data) {
      devWarn('error on facebook token')
      toast.error(I18n.t('error.Login facebook fail'))
      return
    }
    const cred = auth.FacebookAuthProvider.credential(data.accessToken)
    return cred
  }
}

async function facebookLogin() {
  try {
    const cred = await getFacebookCredential()
    return await getCurrentUser(cred)
  } catch (e) {
    devWarn('facebook login error', e)
    throw e
  }
}

async function getAppleCredential() {
  //start a apple sign-in request
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  })

  // get current authentication state for user
  // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
  const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user)

  // use credentialState response to ensure the user is authenticated
  if (credentialState === appleAuth.State.AUTHORIZED) {
    //if the request was successful, extract the token and nonce
    const { identityToken, nonce } = appleAuthRequestResponse

    // create a Firebase `AppleAuthProvider` credential
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce)
    return appleCredential
  }
}

async function appleLogin() {
  try {
    //start a apple sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    })

    // get current authentication state for user
    // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
    const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user)

    // use credentialState response to ensure the user is authenticated
    if (credentialState === appleAuth.State.AUTHORIZED) {
      //if the request was successful, extract the token and nonce
      const { identityToken, nonce, fullName, email } = appleAuthRequestResponse

      const displayName = fullName?.givenName + ' ' + fullName?.familyName

      // create a Firebase `AppleAuthProvider` credential
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce)
      return await getCurrentUser(appleCredential, displayName, email ?? undefined)
    }

    throw 'Not authorised'
  } catch (e) {
    devWarn('appleLogin', e)
    throw e
  }
}

async function logout() {
  devLog('[Call logout]')
  // Cancel Notification
  // Clear local first
  Reminder.cancelAllNotifications()
  asyncClear()
  await Notification.unsubscribeTopics()

  try {
    if (auth().currentUser) await auth().signOut()
  } catch (err) {
    devLog('Error logout auth', err)
  }

  // clear Auth after that. If can't connect or error, force quit
  try {
    await GoogleSignin.signOut()
  } catch (err) {
    devLog('Error logout Google', err)
  }

  try {
    LoginManager.logOut()
  } catch (err) {
    devLog('Error logout Login Manager', err)
  }

  // await appleAuth.performRequest({
  //   requestedOperation: AppleAuthRequestOperation.LOGOUT,
  // })
}

async function asyncClear() {
  const setReminder = await AsyncStorage.getItem('SetReminder')
  const loginEmail = await AsyncStorage.getItem('emailForSignIn')
  // clear asyncstorage
  await AsyncStorage.clear()
  if (setReminder !== null) {
    // re-add reminder
    await AsyncStorage.setItem('SetReminder', setReminder)
  }
  if (loginEmail) {
    await AsyncStorage.setItem('emailForSignIn', loginEmail)
  }
}

async function onAppleLogout() {
  try {
    // performs logout request
    await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGOUT,
    })
  } catch (e) {
    devWarn('Error on apple logut', e)
  }
}

async function deleteUser() {
  try {
    const user = firebase.auth().currentUser
    if (!user) {
      return {
        success: false,
        message: `Can't found user`,
      }
    }

    await firebase.auth().currentUser?.delete()
    Reminder.cancelAllNotifications()
    await asyncClear()
    await Notification.unsubscribeTopics()

    devLog('deleteUser success')
    return {
      success: true,
    }
  } catch (error: any) {
    if (error?.message?.toString()?.includes('auth/requires-recent-login')) {
      return {
        success: false,
        message: 're-login',
      }
    }
    return {
      success: false,
      message: I18n.t('text.Something went wrong'),
    }
  }
}

async function deleteUserWithNewCredential() {
  try {
    const user = firebase.auth().currentUser
    const credential = await getCredential()
    if (!user || !credential) {
      return {
        success: false,
        message: `Can't found user`,
      }
    }

    await firebase.auth().currentUser?.reauthenticateWithCredential(credential)
    Reminder.cancelAllNotifications()
    await asyncClear()
    await Notification.unsubscribeTopics()
    await firebase.auth().currentUser?.delete()
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: I18n.t('text.Something went wrong'),
    }
  }
}

export const getCredential = async () => {
  try {
    const providerData = await auth().currentUser?.providerData

    if (providerData?.length) {
      const providerId = providerData[0].providerId
      let authCredential

      const token = (await auth().currentUser?.getIdToken()) || ''
      if (!token) return
      if (providerId === 'google.com') {
        authCredential = await getGoogleCredential()
      } else if (providerId === 'facebook.com') {
        authCredential = await getFacebookCredential()
      } else {
        authCredential = await getAppleCredential()
      }
      return authCredential
    }
  } catch (error) {
    devLog('getCredentials error', error)
  }
}

const emailLogin = async (email: string) => {
  try {
    const response = await axios.post(`${Config.SERVER}/func_login_email`, {
      email,
      appName: Config.VARIANT,
    })
    const { success, message } = response.data as any
    if (!success) {
      Toast.error(message)
      return false
    } else {
      await AsyncStorage.setItem('emailForSignIn', email)
      return true
    }
  } catch (e: any) {
    devLog('[ERROR LOGIN EMAIL]', e)
    Toast.error(e.message)
    return false
  }
}

export default {
  currentUser: getCurrentUser,
  login: {
    google: googleLogin,
    facebook: facebookLogin,
    apple: appleLogin,
    email: emailLogin,
  },
  logout,
  logoutApple: onAppleLogout,
  updateUser: updateUser,
  deleteUser,
  deleteUserWithNewCredential,
}
