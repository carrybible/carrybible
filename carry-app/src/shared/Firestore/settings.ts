import firestore from '@react-native-firebase/firestore'
import collections from './collections'

export async function getSettings() {
  try {
    const result = await firestore().collection(collections.SETTINGS).limit(1000).get()
    const settings = {}
    result.docs.forEach(doc => (settings[doc.id] = doc.data()))
    return settings
  } catch (e) {
    devLog('Error get populated prompt', e)
  }
  return []
}

export default {
  getSettings,
}
