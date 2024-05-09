import Pencil from '@assets/icons/Pencil.svg'
import AddAnActivity from '@assets/images/AddAnActivity.png'
import Banner from '@components/Banner'
import Button from '@components/Button'
import PageLayout from '@components/Layout/PageLayout'
import ChooseGroupModal, {
  ChooseGroupModalRef,
} from '@components/Modals/Plan/ChooseGroupModal'
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
import PlanCreationModal, {
  PlanCreationModalRef,
} from '@components/Modals/Plan/CreatePlanModal'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useRef } from 'react'
import { Plan } from '@dts/Plans'
import { createOrgPlan } from '@shared/Firebase/plan'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { useAppSelector } from '@redux/hooks'
import { message } from 'antd'

const PlanDetailPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const planId = router.query.planId as string
  const me = useAppSelector((state) => state.me)

  const { plan, loading } = usePlanDetailData({ mode: 'view', planId })
  const { startLoading, stopLoading } = useGlobalLoading()

  const chooseGroupModalRef = useRef<ChooseGroupModalRef>(null)
  const planCreationModalRef = useRef<PlanCreationModalRef>(null)

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
    }[] = []

    actions.push({
      key: 'edit-plan-details',
      label: t('plans.edit-plan-details'),
      icon: <Image src={Pencil} alt="edit-detail-icon" />,
    })

    return actions
  }, [t])

  useBreadcrumb({
    label: plan?.name ?? t('plan.template'),
  })

  const disabledTemplate = useMemo(() => {
    return plan?.blocks.some((i) => !i.name || !i.activities?.length)
  }, [plan])

  const onPressEditPlan = useCallback((plan: Plan) => {
    planCreationModalRef.current?.show(plan)
  }, [])

  if (!plan && !loading) {
    return <NotFoundPage />
  }
  if (!plan) {
    return null
  }

  const infoBlocks = [
    <div key={1} className="flex flex-1 flex-col">
      <H5>{t('plans.plan-description')}</H5>
      <Text className="text-neutral-80">{plan?.description}</Text>
    </div>,
  ]

  const onPressUseTemplate = () => {
    planCreationModalRef.current?.show(plan, 'template')
  }

  const handleUseTemplate = async ({
    name,
    description,
    featuredImage,
  }: {
    name: string
    description: string
    featuredImage: string
  }) => {
    const loadingId = await startLoading({
      message: '✨ Copying this template...',
      background: 'primary',
    })
    const masterRole =
      me?.organisation?.role === 'admin' || me?.organisation?.role === 'owner'
    const copyPlan = {
      ...plan,
      name,
      description,
      featuredImage,
      baseTemplatePlan: plan.id,
      markAsTemplate: false,
      shareWithMobile: false,
      campus: {
        campusId: me?.campusAccess?.[0]?.id ?? '',
        campusName: me?.campusAccess?.[0]?.name ?? '',
      },
    } as Omit<Plan, 'id' | 'created' | 'updated' | 'markAsTemplate'>
    if (masterRole) {
      delete copyPlan.campus
    }
    const {
      success,
      message: errorMessage,
      data,
    } = await createOrgPlan({
      organisationId: me.organisation.id,
      plan: copyPlan,
    })
    if (!success || !data) {
      console.error('create plan error: ', errorMessage)
      message.error(t('error-server'))
      return
    }
    stopLoading(loadingId)
    if (data.planId) {
      await router.push({
        pathname: `/plans/${data.planId}`,
        query: { mode: 'edit' },
      })
      message.success(t('plan.copied-plan-success'))
    }
  }

  return (
    <PageLayout routeChangeLoading>
      <PlanInfo
        avatar={plan?.featuredImage || ''}
        columns={infoBlocks}
        name={plan?.name || ''}
        duration={plan?.duration || 0}
        buttonMore={{
          data: buttonMoreData,
          onClick: ({ key }) => {
            if (key === 'edit-plan-details') {
              onPressEditPlan(plan)
            }
          },
        }}
        button={
          <Button onClick={onPressUseTemplate} disabled={disabledTemplate}>
            {t('plans.use-template')}
          </Button>
        }
      />

      <div
        className={classNames(
          'flex flex-row flex-wrap',
          'justify-between',
          'mt-6'
        )}
      >
        <Banner
          className="w-full"
          title={t('plans.template-banner-title')}
          content={t('plans.template-banner-desc')}
          image={{
            img: AddAnActivity,
            imgAlt: 'AddAnActivity',
            width: 203,
            height: 177,
          }}
        />
      </div>
      <PlanDays plan={plan} readonly={true} isTemplate />
      <ChooseGroupModal ref={chooseGroupModalRef} plan={plan} />
      <PlanCreationModal
        ref={planCreationModalRef}
        handleUseTemplate={handleUseTemplate}
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
  withEnsureRouterQuery(PlanDetailPage, ['planId']),
  {
    // TODO: revert this when server return this permission
    permissionsRequire: [],
    // permissionsRequire: [Permissions.VIEW_GROUP],
    noPermissionView: true,
  }
)
