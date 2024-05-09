import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

declare interface Group {
  id: string
  owner: string
  name: string
  description?: string
  image: string
  communicationType: 'group' | 'direct'
  directMessageId?: string
  service: 'StreamIO'
  cid?: string
  visibility: 'public' | 'private'
  deleted?: boolean
  members: Array<string>
  memberCount: number
  created: FirebaseFirestoreTypes.FieldValue
  updated: FirebaseFirestoreTypes.FieldValue
  organisation?: {
    id: string
    role?: string
  }
}

export default Group
