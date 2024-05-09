import { useAppSelector } from '@redux/hooks'
import Firebase from '@shared/Firebase'
import { Campus } from '@shared/Firebase/campus'
import { collection, CollectionReference } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'

const useCampuses = (): { campuses: Campus[] | undefined } => {
  const me = useAppSelector((state) => state.me)
  const [campuses] = useCollectionData(
    collection(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      me.organisation.id,
      Firebase.collections.CAMPUS
    ) as CollectionReference<Campus>
  )
  if (['campus-leader', 'campus-user'].includes(me.organisation.role || '')) {
    const campusIds = me.organisation.campusIds
    const campusId = me.organisation.campusId

    return {
      campuses: campuses?.filter(
        (c) => campusIds?.includes(c.id || '') || campusId === c.id
      ),
    }
  }
  return { campuses }
}

export default useCampuses
