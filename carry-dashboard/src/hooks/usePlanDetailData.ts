import { Plan } from '@dts/Plans'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { injectUserInfoToPlans } from '@redux/thunks/plan'
import Firebase from '@shared/Firebase'
import { doc, DocumentReference } from 'firebase/firestore'
import { useEffect } from 'react'
import { useDocumentData } from 'react-firebase-hooks/firestore'

const usePlanDetailData = ({
  planId,
}: {
  mode?: 'edit' | 'view'
  planId: string
}): { plan?: Plan; loading: boolean } => {
  const dispatch = useAppDispatch()
  const me = useAppSelector((state) => state.me)
  const { startLoading, stopLoading } = useGlobalLoading()
  const [plan, loading] = useDocumentData(
    doc(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      me.organisation.id,
      Firebase.collections.ORG_PLANS,
      planId
    ) as DocumentReference<Plan>
  )

  const planInfos = useAppSelector((state) => state.plan.planInfos)

  const localPlan = plan || planInfos[planId]

  useEffect(() => {
    if (localPlan) {
      stopLoading()
      return
    }
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, localPlan, startLoading, stopLoading])

  useEffect(() => {
    const run = async () => {
      if (!loading) {
        await dispatch(
          injectUserInfoToPlans({
            plans: plan ? [plan] : [],
          })
        )
      }
    }
    run()
  }, [dispatch, loading, plan])

  return {
    plan: localPlan,
    loading,
  }
}

export default usePlanDetailData
