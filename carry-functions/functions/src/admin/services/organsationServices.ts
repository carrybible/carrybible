import { firestore } from 'firebase-admin'
import collections from '../../types/collections'

export const getOrganisationInfo = async (orgId: string) => {
  let result: Carry.Organisation = {} as Carry.Organisation

  if (!orgId) return result

  const orgQuery:
    | FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    | FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(orgId)

  const OrgRef = await orgQuery.get()
  result = OrgRef.data() as Carry.Organisation
  return result
}

export default { getOrganisationInfo }
