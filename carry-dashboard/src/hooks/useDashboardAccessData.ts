import { useAppSelector } from '@redux/hooks'
import Firebase from '@shared/Firebase'
import { Campus } from '@shared/Firebase/campus'
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
} from 'firebase/firestore'
import {
  useDocumentData,
  useCollectionData,
} from 'react-firebase-hooks/firestore'

// export type CampusPermission = {
//   campusId: string
//   createBy?: string
//   updateBy?: string
// }

export type CampusTracking = {
  campusId: string
  createBy?: string
  updateBy?: string
}

export type dashboardAccessData = {
  uid: string
  organisation: {
    accessedDashboard: boolean
    campusIds: string[]
  }
}

const useDashboardAccessData = (): {
  loading: boolean
  dashboardAccessData: dashboardAccessData | undefined
} => {
  const me = useAppSelector((state) => state.me)
  const [campus] = useCollectionData(
    collection(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      me.organisation.id,
      Firebase.collections.CAMPUS
    ) as CollectionReference<Campus>
  )
  const [dashboardAccessData, loading] = useDocumentData(
    doc(
      Firebase.firestore,
      Firebase.collections.USERS,
      me.uid
    ) as DocumentReference<{
      uid: string
      organisation: {
        accessedDashboard: boolean
        campusIds: string[]
        campusTracking: CampusTracking[]
      }
    }>
  )
  if (me.organisation?.role === 'admin' || me.organisation?.role === 'owner') {
    const campusIds = campus?.map((x) => {
      return x.id ?? ''
    })
    const result: dashboardAccessData = {
      uid: me.uid,
      organisation: {
        accessedDashboard: true,
        campusIds: campusIds ?? [],
      },
    }
    return { loading: false, dashboardAccessData: result }
  } else {
    return { dashboardAccessData, loading }
  }
}

export default useDashboardAccessData
