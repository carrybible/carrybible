import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

declare interface Member {
  id: string
  joinAt: FirebaseFirestoreTypes.Timestamp
  goalAlertTime: FirebaseFirestoreTypes.Timestamp
}
export default Member
