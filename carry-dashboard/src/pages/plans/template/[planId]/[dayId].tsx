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
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useRef, useState } from 'react'

const PlanDayDetail: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const planId = router.query['planId'] as string
  const dayIndex = Number(router.query['dayId'] as string)

  const enterPlanDayTitleModalRef = useRef<EnterPlanDayTitleModalRef>(null)
  const activitiesRef = useRef<PlanDayActivitiesBuilderRef>(null)

  const { plan, block, loading } = useDayDetailData({
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

  if (!block && !loading) {
    return <NotFoundPage />
  }
  if (!plan || !block) {
    return null
  }

  return (
    <PageLayout routeChangeLoading>
      <DayInfo block={block} isOutOfSynced={isOutOfSynced} isReadOnly />

      <PlanDayActivitiesBuilder
        ref={activitiesRef}
        initActivities={block.activities}
        onActivitiesUpdate={onLocalActivitiesUpdate}
        isReadOnly
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
