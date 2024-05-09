import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

export interface FollowUp {
  id: string
  content: string
  updated: FirebaseFirestoreTypes.FieldValue
  creatorInfo: {
    userId: string
    image?: string
    name?: string
  }
  viewers: Array<string>
  // local attribute
  unread?: boolean
}

export default FollowUp
