import Delete from '@assets/icons/Delete.svg'
import Export from '@assets/icons/Export.svg'
import Key from '@assets/icons/Key.svg'
import Pencil from '@assets/icons/Pencil.svg'
import EditActivitiesImage from '@assets/images/EditActivities.png'
import EmptySocialVideo from '@assets/images/EmptySocialVideo.png'
import SchedulePlanImage from '@assets/images/SchedulePlan.png'
import Banner from '@components/Banner'
import Button from '@components/Button'
import PageLayout from '@components/Layout/PageLayout'
import ChooseGroupModal, {
  ChooseGroupModalRef,
} from '@components/Modals/Plan/ChooseGroupModal'
import PlanCreationModal, {
  PlanCreationModalRef,
} from '@components/Modals/Plan/CreatePlanModal'
import DeletePlanModal, {
  DeletePlanModalRef,
} from '@components/Modals/Plan/DeletePlanModal'
import EnterCampusModal, {
  EnterCampusModalRef,
} from '@components/Modals/Plan/EnterCampusModal'
import SharePlanModal, {
  SharePlanModalRef,
} from '@components/Modals/Plan/SharePlanModal'
import ReviewSocialPostModal from '@components/Modals/ReviewSocialPostModal'
import PlanDays from '@components/PlanBuilder/PlanDays'
import PlanInfo from '@components/ProfileBlocks/PlanInfo'
import GroupUsingPlanTable from '@components/Table/GroupUsingPlanTable'
import { H4, H5, Text } from '@components/Typography'
import { Plan } from '@dts/Plans'
import withEnsureRouterQuery from '@hoc/withEnsureRouterQuery'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import usePlanDetailData from '@hooks/usePlanDetailData'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateOrgPlan } from '@shared/Firebase/plan'
import { withTrans } from '@shared/I18n'
import { message } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import SocialPostTable from '@components/Table/SocialPostTable'
import TourInviteMemberQRModal, {
  TourInviteMemberQRModalRef,
} from '@components/Modals/TourInviteMemberQRModal'
import { hideHighlight, showHighlight } from '@redux/slices/app'
import { updateDashboardOnboarding } from '@shared/Firebase/account'
import Plyr from 'plyr-react'

const PlanDetailPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const planId = router.query.planId as string

  // const [mode, changeMode] = usePlanDetailMode()
  const { plan, loading } = usePlanDetailData({ mode: 'view', planId })

  const me = useAppSelector((state) => state.me)
  const orgInfo = useAppSelector((state) => state.organisation.info)
  const { isHighlight } = useAppSelector((state) => state.app)

  const chooseGroupModalRef = useRef<ChooseGroupModalRef>(null)
  const planCreationModalRef = useRef<PlanCreationModalRef>(null)
  const sharePlanModalRef = useRef<SharePlanModalRef>(null)
  const editCampusModalRef = useRef<EnterCampusModalRef>(null)
  const deletePlanModalRef = useRef<DeletePlanModalRef>(null)
  const tourInviteMemberQRModalRef = useRef<TourInviteMemberQRModalRef>(null)

  const [showTour, setShowTour] = useState<boolean>(false)

  const reviewRef = useRef<any>()

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
      danger?: boolean
    }[] = []

    actions.push({
      key: 'edit-plan-details',
      label: t('plans.edit-plan-details'),
      icon: <Image src={Pencil} alt="edit-detail-icon" />,
    })
    if (['admin', 'owner'].includes(me?.organisation?.role ?? '')) {
      actions.push({
        key: 'edit-sharing-plan',
        label: t('plans.edit-sharing-plan'),
        icon: <Image src={Export} alt="edit-sharing-icon" />,
      })
      actions.push({
        key: 'edit-plan-campus',
        label: t('plans.campus-access'),
        icon: <Image src={Key} alt="edit-campus-icon" />,
      })
    }
    if (
      ['admin', 'owner', 'campus-user', 'campus-leader'].includes(
        me?.organisation?.role ?? ''
      )
    ) {
      actions.push({
        danger: true,
        key: 'delete-plan',
        label: t('plan.delete-plan'),
        icon: (
          <Image src={Delete} className="text-warning" alt="delete-plan-icon" />
        ),
      })
    }
    return actions
  }, [t, me.organisation?.role])

  useBreadcrumb({
    label: plan?.name ?? t('plan.plan-detail'),
  })

  const disabledSchedule = useMemo(() => {
    return plan?.blocks?.some((i) => !i.name || !i.activities?.length)
  }, [plan])

  const showTourEditPlan = useMemo(
    () => me?.dashboardOnboarding && !me?.dashboardOnboarding?.editPlan,
    [me?.dashboardOnboarding]
  )

  const showTourSchedulePlan = useMemo(
    () => me?.dashboardOnboarding && !me?.dashboardOnboarding?.readySchedule,
    [me?.dashboardOnboarding]
  )

  useEffect(() => {
    if (showTourEditPlan) {
      dispatch(showHighlight())
    }
  }, [dispatch, loading, showTourEditPlan])

  useEffect(() => {
    if (showTourSchedulePlan && !showTourEditPlan && !disabledSchedule) {
      dispatch(showHighlight())
    }
  }, [disabledSchedule, dispatch, showTourEditPlan, showTourSchedulePlan])

  useEffect(() => {
    if (showTour && showTourEditPlan && !isHighlight) {
      updateDashboardOnboarding({ editPlan: true })
    }
  }, [showTour, isHighlight, showTourEditPlan])

  useEffect(() => {
    if (isHighlight) {
      setShowTour(true)
    }
  }, [isHighlight])

  useEffect(() => {
    if (
      showTour &&
      showTourSchedulePlan &&
      !isHighlight &&
      disabledSchedule !== undefined &&
      disabledSchedule === false
    ) {
      updateDashboardOnboarding({ readySchedule: true, editPlan: true })
      setShowTour(false)
    }
  }, [showTour, isHighlight, disabledSchedule, showTourSchedulePlan])

  const onPressEditPlan = useCallback((plan: Plan) => {
    planCreationModalRef.current?.show(plan)
  }, [])

  const onPressSharingPlan = useCallback((plan: Plan) => {
    sharePlanModalRef.current?.show(plan)
  }, [])

  const SermonView = useMemo(() => {
    if (!plan?.planYouTubeVideoUrl) return null
    if (!plan?.planVideo) {
      return (
        <div className={classNames('mt-10 mb-6')}>
          <H4>{t('plans.social-post')}</H4>
          <div
            className={classNames(
              'back mt-5 flex flex-col items-center rounded-[10px] border-2 border-r-2 border-solid border-neutral-50 bg-neutral-10 px-6 py-6 sm:flex-row sm:items-end sm:justify-between'
            )}
          >
            <Image src={EmptySocialVideo} alt="" />
            <div className="ml-5 pb-8">
              <div>
                <H4 className="text-start text-2xl">
                  {t('plans.sermon-video-generating')}
                </H4>
              </div>
              <div className="">
                <Text className="text-center text-neutral-80 sm:text-start">
                  {t('plans.sermon-video-generating-description')}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={classNames('mt-10 mb-6')}>
        <H4>{t('plans.social-post')}</H4>
        <div className="mt-7 flex flex-row overflow-x-auto">
          <Plyr
            autoPlay
            source={{
              type: 'video',
              sources: [
                {
                  src: plan?.planVideo || '',
                  provider: 'html5',
                },
              ],
            }}
          />
        </div>
      </div>
    )
  }, [plan?.planVideo, plan?.planYouTubeVideoUrl, t])

  const onPressEditPlanCampus = useCallback(async () => {
    const campusId = await editCampusModalRef.current?.show()

    const campus = me.campusAccess.find((i) => i.id === campusId)

    const { success, message: errorMessage } = await updateOrgPlan({
      plan: {
        id: planId,
        campus:
          (campus && {
            campusId: campus.id,
            campusName: campus.name || '',
          }) ||
          null,
      },
      organisationId: me.organisation.id,
    })
    if (!success) {
      console.error('update plan Error: ', errorMessage)
      message.error(t('error-server'))
      return
    }
    message.success(t('plans.campus-updated'))
  }, [me.campusAccess, me.organisation.id, planId, t])

  const onPressDeletePlan = useCallback((plan: Plan) => {
    deletePlanModalRef.current?.show({
      organizationId: me.organisation.id,
      planId: planId,
      planAvatar: plan.featuredImage,
      planName: plan.name,
    })
  }, [])

  const onDeleted = () => router.replace('/plans')

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

  const onPressSchedulePlan = () => {
    dispatch(hideHighlight())
    chooseGroupModalRef.current?.show()
  }

  return (
    <PageLayout routeChangeLoading>
      <PlanInfo
        avatar={plan.featuredImage || ''}
        columns={infoBlocks}
        name={plan.name || ''}
        duration={plan.duration || 0}
        buttonMore={{
          data: buttonMoreData,
          onClick: ({ key }) => {
            const fullPlan = { ...plan, id: planId }
            if (key === 'edit-plan-details') {
              onPressEditPlan(fullPlan)
            }
            if (key === 'edit-sharing-plan') {
              onPressSharingPlan(fullPlan)
            }
            if (key === 'edit-plan-campus') {
              onPressEditPlanCampus()
            }
            if (key === 'delete-plan') {
              onPressDeletePlan(fullPlan)
            }
          },
        }}
        button={
          <Button
            onClick={onPressSchedulePlan}
            disabled={disabledSchedule}
            className={classNames(
              'w-10/12 px-10 sm:w-auto',
              showTourSchedulePlan && 'relative z-[10001]'
            )}
          >
            {t('plans.schedule-plan')}
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
        {disabledSchedule ? (
          <Banner
            className={classNames(
              'w-full',
              showTourEditPlan && 'relative z-[10001] !bg-[#fff]'
            )}
            title={t('plans.add-activities-title')}
            content={t('plans.add-activities-content')}
            image={{
              img: EditActivitiesImage,
              imgAlt: 'EditActivities',
              width: 203,
              height: 177,
            }}
          />
        ) : (
          <Banner
            className={classNames(
              'w-full',
              showTourSchedulePlan && 'relative z-[10001] bg-[#fff]'
            )}
            title={t('plans.schedule-plan-title')}
            content={t('plans.schedule-plan-description')}
            image={{
              img: SchedulePlanImage,
              imgAlt: 'SchedulePlan',
              width: 124,
              height: 113,
            }}
          />
        )}
      </div>
      <PlanDays
        plan={{ ...plan, id: planId }}
        showHighlightEdit={showTourEditPlan && disabledSchedule}
      />
      {orgInfo?.enableGeneratePlanFromSermon ? SermonView : null}
      <GroupUsingPlanTable planId={planId} />
      <ChooseGroupModal
        ref={chooseGroupModalRef}
        plan={{ ...plan, id: planId }}
        onSuccess={(groupId) =>
          groupId && tourInviteMemberQRModalRef.current?.show()
        }
      />
      <PlanCreationModal ref={planCreationModalRef} />
      <SharePlanModal ref={sharePlanModalRef} />
      <EnterCampusModal
        defaultCampus={plan.campus?.campusId ?? ''}
        ref={editCampusModalRef}
      />
      <DeletePlanModal ref={deletePlanModalRef} onDeleted={onDeleted} />
      {orgInfo?.enableGeneratePlanFromSermon ? (
        <ReviewSocialPostModal ref={reviewRef} />
      ) : null}
      <TourInviteMemberQRModal ref={tourInviteMemberQRModalRef} me={me} />
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
