import { useAppSelector } from '@redux/hooks'
import Firebase from '@shared/Firebase'
import { collection, CollectionReference } from 'firebase/firestore'
import { useCollectionData } from 'react-firebase-hooks/firestore'

export type OrganisationData = {
  id: string
  name: string
}

const useOrganisationData = (): {
  loading: boolean
  organisationData: OrganisationData[] | undefined
} => {
  const me = useAppSelector((state) => state.me)
  const [orgs] = useCollectionData(
    collection(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS
    ) as CollectionReference<OrganisationData>
  )
  if (me.isGM) {
    if (me.gm?.accessAll) {
      return { loading: false, organisationData: orgs }
    } else {
      return {
        loading: false,
        organisationData: orgs?.filter((x) =>
          me?.gm?.organisationIds?.includes(x.id)
        ),
      }
    }
  } else return { loading: false, organisationData: [] }
}

export default useOrganisationData
