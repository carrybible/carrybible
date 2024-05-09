import PageLayout from '@components/Layout/PageLayout'
import PlanDays from '@components/PlanBuilder/PlanDays'
import PlanInfo from '@components/ProfileBlocks/PlanInfo'
import { H5, Text } from '@components/Typography'
import withEnsureRouterQuery from '@hoc/withEnsureRouterQuery'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import usePlanDetailData from '@hooks/usePlanDetailData'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'
import { useAppSelector } from '@redux/hooks'
import useGroupName from '@hooks/useGroupName'

const PlanDetailPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const planId = router.query.planId as string

  const { plan, loading } = usePlanDetailData({ mode: 'view', planId })
  const orgInfo = useAppSelector((state) => state.organisation.info)

  const { groupId } = router.query as { groupId: string }
  const groupName = useGroupName(groupId)
  useBreadcrumb({
    label: plan?.name ?? t('plan.plan-detail'),
    indexLevel: {
      index: 2,
      label: groupName || '',
    },
  })

  if (!plan && !loading) {
    return <NotFoundPage />
  }
  if (!plan) {
    return null
  }

  const infoBlocks = [
    <div key={1} className="flex flex-1 flex-col">
      <H5>{t('plans.plan-description')}</H5>
      <Text className="text-neutral-80">{plan.description}</Text>
    </div>,
    <div key={2} className="flex flex-1 flex-col">
      <H5>{t('plan.owned-by')}</H5>
      <Text className="text-neutral-80">
        {plan.campus?.campusName || `${orgInfo?.name} Org`}
      </Text>
    </div>,
  ]

  return (
    <PageLayout routeChangeLoading>
      <PlanInfo
        avatar={plan.featuredImage || ''}
        columns={infoBlocks}
        name={plan.name || ''}
        duration={plan.duration || 0}
      />
      <PlanDays plan={plan} isPreview readonly />
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
  withEnsureRouterQuery(PlanDetailPage, ['planId']),
  {
    // TODO: revert this when server return this permission
    permissionsRequire: [],
    // permissionsRequire: [Permissions.VIEW_GROUP],
    noPermissionView: true,
  }
)
