import { Organisation } from '@dts/Organisation'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateOrganisation } from '@redux/slices/organisation'
import Firebase from '@shared/Firebase'
import { doc, DocumentReference } from 'firebase/firestore'
import { useEffect } from 'react'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import useGlobalLoading from './useGlobalLoading'

const useOrganisationInfo = (): {
  organisationInfo?: Organisation
  loading: boolean
} => {
  const me = useAppSelector((state) => state.me)
  const orgInfoLocal = useAppSelector((state) => state.organisation.info)
  const { startLoading, stopLoading } = useGlobalLoading()
  const dispatch = useAppDispatch()

  const [organisationInfo, loading] = useDocumentData(
    doc(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      me.isGM ? me.defaultGMAccess ?? me.organisation.id : me.organisation.id
    ) as DocumentReference<Organisation>
  )

  useEffect(() => {
    if (orgInfoLocal) {
      return
    }
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, orgInfoLocal, startLoading, stopLoading])

  useEffect(() => {
    const run = async () => {
      if (!loading) {
        dispatch(updateOrganisation({ info: organisationInfo }))
      }
    }
    run()
  }, [organisationInfo, loading, dispatch])

  return { organisationInfo, loading }
}

export default useOrganisationInfo
