import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

export type GroupActionsType = 'prayer' | 'gratitude'
export type GroupTabType = 'unread' | 'all'
export interface GroupActions {
  id: string
  type: GroupActionsType
  creator: string
  requestText?: string
  content: string
  viewerIds: string[]
  reactedUserIds?: string[]
  created: FirebaseFirestoreTypes.FieldValue
  updated: FirebaseFirestoreTypes.FieldValue
}

export default GroupActions
