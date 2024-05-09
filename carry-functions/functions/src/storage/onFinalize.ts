import { firestore } from 'firebase-admin'
import { storage } from 'firebase-functions'
import * as path from 'path'
import { Service } from '../shared'

const versions: { [key: string]: any } = {
  esv: {
    abbr: 'esv',
    name: 'English Standard Version',
    lang: 'en',
    published: 2001,
    publisher: 'Crossway',
  },
  web: {
    abbr: 'web',
    name: 'World English Bible',
    lang: 'en',
    published: 1997,
    publisher: 'Rainbow Missions',
  },
  niv: {
    abbr: 'niv',
    name: 'New International Version',
    lang: 'en',
    published: 2011,
    publisher: 'Biblica',
  },
  kjv: {
    abbr: 'kjv',
    name: 'King James Version',
    lang: 'en',
    published: 1611,
    publisher: "Queen's Printer",
  },
  rv1909: {
    abbr: 'rv1909',
    name: 'Reina–Valera',
    lang: 'es',
    published: 1909,
    publisher: 'Casiodoro de Reina',
  },
}

const onFinalize = storage.object().onFinalize(async (obj, context) => {
  // Only run on objects that are created under translations folder
  if (obj.name?.startsWith('translations/')) {
    const fileName = path.basename(obj.name)
    const abbr: string = fileName.split('.')[0]

    if (abbr in versions) {
      const translation: Carry.Translation = {
        ...versions[abbr],
        ...(path.extname(obj.name) === '.usfm' ? { usfmPath: obj.name, usfmId: obj.id } : {}),
        ...(path.extname(obj.name) === '.json' ? { indexPath: obj.name, indexId: obj.id } : {}),
        ...(path.extname(obj.name) === '.carry' ? { carryPath: obj.name, carryId: obj.id } : {}),
        bucket: obj.bucket,
        version: firestore.FieldValue.increment(1),
        updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      }
      await Service.Firebase.firestore().doc(`translations/${abbr}`).set(translation, { merge: true })
    }
  }
})

export default onFinalize
