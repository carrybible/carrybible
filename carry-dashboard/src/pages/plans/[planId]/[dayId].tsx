import Delete from '@assets/icons/Delete.svg'
import Pencil from '@assets/icons/Pencil.svg'
import PageLayout from '@components/Layout/PageLayout'
import EnterPlanDayTitleModal, {
  EnterPlanDayTitleModalRef,
} from '@components/Modals/Plan/EnterPlanDayTitleModal'
import PlanDayActivitiesBuilder, {
  PlanDayActivitiesBuilderRef,
} from '@components/PlanBuilder/PlanDayActivitiesBuilder'
import DayInfo from '@components/ProfileBlocks/DayInfo'
import withEnsureRouterQuery from '@hoc/withEnsureRouterQuery'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useDayDetailData from '@hooks/useDayDetailData'
import useGlobalLoading from '@hooks/useGlobalLoading'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { showHighlight } from '@redux/slices/app'
import { updateDashboardOnboarding } from '@shared/Firebase/account'
import { updateOrgPlan } from '@shared/Firebase/plan'
import { withTrans } from '@shared/I18n'
// import Permissions from '@shared/Permissions'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PlanDayDetail: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const planId = router.query['planId'] as string
  const dayIndex = Number(router.query['dayId'] as string)
  const me = useAppSelector((state) => state.me)
  const { startLoading } = useGlobalLoading()
  const dispatch = useAppDispatch()
  const { isHighlight } = useAppSelector((state) => state.app)
  const [showTour, setShowTour] = useState<boolean>(false)

  const enterPlanDayTitleModalRef = useRef<EnterPlanDayTitleModalRef>(null)
  const activitiesRef = useRef<PlanDayActivitiesBuilderRef>(null)

  const { plan, block, loading, handleUpdateBlock } = useDayDetailData({
    planId,
    dayIndex,
  })

  useBreadcrumb({
    label: t('plans.day-index', { indexValue: dayIndex + 1 }),
    previousLabel: plan?.name,
  })

  const [isOutOfSynced, setIsOutOfSynced] = useState(false)
  const onLocalActivitiesUpdate = () => {
    setIsOutOfSynced(true)
  }

  const showTourAddActivity = useMemo(
    () => me?.dashboardOnboarding && !me?.dashboardOnboarding?.addActivity,
    [me]
  )

  useEffect(() => {
    if (!me?.dashboardOnboarding?.addActivity) {
      dispatch(showHighlight())
      setShowTour(true)
    }
  }, [dispatch, me])

  useEffect(() => {
    if (showTour && !me?.dashboardOnboarding?.addActivity && !isHighlight) {
      updateDashboardOnboarding({ addActivity: true })
    }
  }, [me, showTour, isHighlight])

  const handleDeleteDay = useCallback(async () => {
    if (!plan) {
      return
    }
    const { blocks, duration } = plan
    await startLoading({
      message: t('plans.deleting-day'),
      background: 'primary',
    })
    await updateOrgPlan({
      plan: {
        ...plan,
        id: planId,
        blocks: blocks.filter((block, blockIndex) => blockIndex !== dayIndex),
        duration: duration - 1,
      },
      organisationId: me.organisation.id,
    })
    await router.replace(`/plans/${plan.id}`)
  }, [dayIndex, me.organisation.id, plan, planId, router, startLoading, t])

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      danger?: boolean
      icon: React.ReactNode
    }[] = []

    actions.push(
      {
        key: 'edit-day-name',
        label: t('plans.edit-day-name'),
        icon: <Image src={Pencil} alt="edit-detail-icon" />,
      },
      {
        key: 'delete-day',
        label: t('plans.delete-day'),
        danger: true,
        icon: <Image src={Delete} className="text-warning" alt="delete-icon" />,
      }
    )

    return actions
  }, [t])

  if (!block && !loading) {
    return <NotFoundPage />
  }
  if (!plan || !block) {
    return null
  }

  return (
    <PageLayout routeChangeLoading>
      <DayInfo
        block={block}
        isOutOfSynced={isOutOfSynced}
        onSaveDay={async () => {
          const activities = activitiesRef.current?.save()
          if (!activities) {
            return
          }
          await handleUpdateBlock(activities)
          setIsOutOfSynced(false)
          router.back()
        }}
        buttonMore={{
          data: buttonMoreData,
          onClick: async ({ key }) => {
            if (key === 'edit-day-name') {
              enterPlanDayTitleModalRef.current?.show({
                plan,
                dayIndex,
              })
            } else if (key === 'delete-day') {
              await handleDeleteDay()
            }
          },
        }}
      />

      <PlanDayActivitiesBuilder
        ref={activitiesRef}
        initActivities={block.activities}
        onActivitiesUpdate={onLocalActivitiesUpdate}
        showTour={showTourAddActivity}
      />

      <EnterPlanDayTitleModal ref={enterPlanDayTitleModalRef} />
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  }
}
export default withPagePermissionChecker(
  withEnsureRouterQuery(PlanDayDetail, ['planId', 'dayId']),
  {
    // TODO: revert this when server return this permission
    permissionsRequire: [],
    // permissionsRequire: [Permissions.VIEW_GROUP],
    noPermissionView: true,
  }
)
