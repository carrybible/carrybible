import RNFS from '@carrybible/react-native-file-system'
import Translation from '@dts/translation'
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
import Constants from '../Constants'
import collections from './collections'

async function getTranslations(): Promise<Array<Translation>> {
  const ref = firestore().collection(collections.TRANSLATIONS).orderBy('name')

  const collection = await ref.get()
  const docs: Translation[] = []
  collection.docs.forEach(snapshot => {
    const doc = snapshot.data() as Translation
    docs.push(doc)
  })
  return docs
}

declare function ProgressCallback(percentage: number, success: boolean, message: string): void

/**
 * Retrieves a Translation by its shortcode
 */
async function getTranslationByAbbreviation(abbreviation?: string): Promise<{ document: Translation; isMissingTran: boolean }> {
  const abbr = abbreviation || 'niv'
  let isMissingTran = false
  let translation = await firestore().doc(`translations/${abbr}`).get()
  if (!translation.exists) {
    isMissingTran = true
    translation = await firestore().doc(`translations/niv`).get()
  }
  const document = translation.data() as Translation
  return { document, isMissingTran }
}

function downloadFile(storagePath: string, progressCallback: typeof ProgressCallback, progressStart: number, progressScale: number) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-useless-escape
    const fileName = storagePath.split(/[\\\/]/).pop()
    const localPath: string = `${RNFS.Dir.Document}/${storagePath}` || ''
    const ref = storage().ref(storagePath)
    const unsubscribe = ref.writeToFile(localPath).on(
      storage.TaskEvent.STATE_CHANGED,
      snapshot => {
        progressCallback(
          progressStart + (snapshot.bytesTransferred / snapshot.totalBytes) * progressScale,
          snapshot.state === storage.TaskState.SUCCESS,
          `Downloading ${fileName}`,
        )
        if (snapshot.state === 'success') {
          resolve(fileName)
        }
      },
      error => {
        reject(fileName)
        unsubscribe()
        devWarn(error)
      },
    )
  })
}

const downloadTranslation: (translation: Translation, progressCallback: typeof ProgressCallback) => void = async (
  translation,
  progressCallback,
) => {
  await RNFS.mkdir(Constants.DIR.TRANSLATIONS)
  await downloadFile(translation.carryPath!, progressCallback, 0, 1)
  // await Utils.wait(2000)
}

const existsTranslation: (a: Translation) => Promise<boolean> = async translation => {
  return await RNFS.exists(`${Constants.DIR.DOCUMENT}/${translation.carryPath}`)
}

export default {
  getAll: getTranslations,
  getAbbr: getTranslationByAbbreviation,
  download: downloadTranslation,
  exists: existsTranslation,
}
