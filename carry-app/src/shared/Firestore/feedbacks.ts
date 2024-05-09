/* eslint-disable max-lines */
import NetInfo from '@react-native-community/netinfo'
import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import I18n from 'i18n-js'
import collections from './collections'

const postFeedback = async (
  type: 'bug' | 'feedback',
  data: {
    message: string

    uid: string
    name: string
    email: string
    groupId: string
    groupName: string

    campusIdOfGroup: string
    orgIdOfGroup: string

    campusIds: string[]
    orgId: string
    orgName: string

    appName: string
    appVersion: string
    appPlatform: string
    deviceVersion: string | number
  },
): Promise<boolean> => {
  // Get current logged in user
  const user = firebase.auth().currentUser
  if (!user) {
    toast.error(I18n.t('error.Unauthenticated'))
    return false
  }

  const networkStatus = await NetInfo.fetch()
  if (!networkStatus.isConnected) {
    toast.error(I18n.t('error.Network error'))
    return false
  }

  // Try to create group on Firestore
  try {
    const date = new Date()
    const offsetInHours = date.getTimezoneOffset() / 60

    const ref = firestore()
      .collection(type === 'bug' ? collections.BUGS : collections.FEEDBACKS)
      .doc()

    const feedbackData = {
      id: ref.id,
      ...data,
      localTimestamp: date.getTime(),
      localDatetime: date.toString(),
      localOffset: offsetInHours,
      created: firestore.FieldValue.serverTimestamp(),
    }
    await ref.set(feedbackData)

    toast.success(I18n.t(type === 'bug' ? 'text.report_bug_success' : 'text.feedback_success'))
    return true
  } catch (e) {
    devWarn('Error create group', e)
    toast.error(I18n.t('error.Failed to send'))
    return false
    // throw e
  }
}

export default {
  postFeedback,
}
