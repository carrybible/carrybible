import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

interface Thread {
  id: string
  members: Array<string>
  startDate: FirebaseFirestoreTypes.Timestamp
  endDate: FirebaseFirestoreTypes.Timestamp
}

export type ThreadPlan = {
  id: string
  planId: string
  replyCount: number
  text: string
  members: Array<string>
  startDate: FirebaseFirestoreTypes.Timestamp
  updated: FirebaseFirestoreTypes.Timestamp
}

export default Thread
