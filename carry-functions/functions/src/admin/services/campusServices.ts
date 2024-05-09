import { firestore } from 'firebase-admin'
import collections from '../../types/collections'

export const getCampuses = async (orgId: string) => {
  let result: Carry.Campus[] = []

  if (!orgId) return result

  const campusQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)
    .collection(collections.CAMPUS)

  const campusRef = await campusQuery.get()
  result = campusRef.docs.map((x) => x.data() as Carry.Campus)
  return result
}

export default { getCampuses }
