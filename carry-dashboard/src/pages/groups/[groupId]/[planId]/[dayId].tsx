import PageLayout from '@components/Layout/PageLayout'
import PlanDayActivitiesBuilder from '@components/PlanBuilder/PlanDayActivitiesBuilder'
import DayInfo from '@components/ProfileBlocks/DayInfo'
import withEnsureRouterQuery from '@hoc/withEnsureRouterQuery'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useDayDetailData from '@hooks/useDayDetailData'
import useGroupName from '@hooks/useGroupName'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
// import Permissions from '@shared/Permissions'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

const PlanDayDetail: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const planId = router.query['planId'] as string
  const dayIndex = Number(router.query['dayId'] as string)

  const { plan, block, loading } = useDayDetailData({
    planId,
    dayIndex,
  })

  const { groupId } = router.query as { groupId: string }
  const groupName = useGroupName(groupId)

  useBreadcrumb({
    label: t('plans.day-index', { indexValue: dayIndex + 1 }),
    previousLabel: plan?.name,
    indexLevel: {
      index: 2,
      label: groupName || '',
    },
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
        isReadOnly
        initActivities={block.activities}
        onActivitiesUpdate={onLocalActivitiesUpdate}
      />
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
