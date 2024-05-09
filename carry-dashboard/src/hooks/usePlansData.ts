import { Plan } from '@dts/Plans'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { plansSelector, updatePlans } from '@redux/slices/plan'
import { injectUserInfoToPlans } from '@redux/thunks/plan'
import Firebase from '@shared/Firebase'
import { collection, CollectionReference } from 'firebase/firestore'
import { useEffect, useMemo } from 'react'
import { useCollectionData } from 'react-firebase-hooks/firestore'

const usePlansData = ({
  searchText,
  useTemplate,
  useFeatured,
}: {
  searchText?: string
  useTemplate?: boolean
  useFeatured?: boolean
  filterCampus?: string
}): { plans: Plan[] | undefined } => {
  const dispatch = useAppDispatch()
  const { startLoading, stopLoading } = useGlobalLoading()
  const me = useAppSelector((state) => state.me)
  const localPlans = useAppSelector(plansSelector)

  const [plans, loading] = useCollectionData(
    collection(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      me.organisation.id,
      Firebase.collections.ORG_PLANS
    ) as CollectionReference<Plan>
  )

  useEffect(() => {
    if (localPlans) {
      return
    }
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, localPlans, startLoading, stopLoading])

  useEffect(() => {
    const run = async () => {
      if (!loading) {
        await dispatch(injectUserInfoToPlans({ plans: plans ?? [] }))
        dispatch(updatePlans(plans ?? []))
      }
    }
    run()
  }, [dispatch, loading, plans])

  const filteredPlans = useMemo(() => {
    let result = localPlans
    if (!localPlans || (!searchText && !useTemplate)) {
      result = localPlans
    }
    if (useTemplate) {
      result = result?.filter((plan) => plan.markAsTemplate)
    } else {
      result = result?.filter((plan) => !plan.markAsTemplate)
    }

    if (useFeatured) {
      result = result?.filter((plan) => plan.shareWithMobile)
    }

    // if (!useTemplate && !useFeatured) {
    //   result = result?.filter(
    //     (plan) => !plan.shareWithMobile && !plan.markAsTemplate
    //   )
    // }

    if (searchText) {
      result = result?.filter((plan) =>
        plan.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
      )
    }
    return result
  }, [localPlans, searchText, useTemplate, useFeatured])

  return { plans: filteredPlans }
}

export default usePlansData
