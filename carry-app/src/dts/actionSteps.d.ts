import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

export type ActionStepStatus = 'active' | 'expired'

export interface ActionSteps {
  id: string
  updated: FirebaseFirestoreTypes.Timestamp
  created: FirebaseFirestoreTypes.Timestamp

  // ----- Render fields, if empty will render default text -----
  actionText: string
  actionTextId?: string
  actionPromptText?: string
  followUpPromptText?: string
  highlightPromptText?: string

  completedMembers: string[] // members that completed this action step
  status: ActionStepStatus // In a group at a same time, there will be only one active action step
  fromDate: FirebaseFirestoreTypes.Timestamp
  toDate: FirebaseFirestoreTypes.Timestamp

  // ----- Server generated and updated -----
  followUpMembers?: string[] // members that completed this action step AND provide follow up
  followUpCount?: number

  // ---- Local attribute ----
  unreadCount?: number
}

export default ActionSteps
