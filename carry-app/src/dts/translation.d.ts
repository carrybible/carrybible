import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

interface Translation {
  name: string
  abbr: string
  usfmPath?: string
  indexPath?: string
  carryPath?: string
  usfmId?: string
  indexId?: string
  carryId?: string
  version: number
  lang?: string
  created?: FirebaseFirestoreTypes.Timestamp
  updated?: FirebaseFirestoreTypes.Timestamp
}

export default Translation
