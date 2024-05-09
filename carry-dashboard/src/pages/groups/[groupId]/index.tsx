import Button from '@components/Button'
import PageLayout from '@components/Layout/PageLayout'
import ChoosePlanModal from '@components/Modals/ChoosePlanModal'
import DeleteGroupModal, {
  DeleteGroupModalRef,
} from '@components/Modals/DeleteGroupModal'
import GroupCreationModal, {
  GroupCreationModalRef,
} from '@components/Modals/GroupCreationModal'
import { ChoosePlanOptionModalRef } from '@components/Modals/Plan/ChoosePlanOptionModal'
import ReviewSocialPostModal from '@components/Modals/ReviewSocialPostModal'
import { GroupPlanBanner } from '@components/Pages/Group/BannerPlan'
import { GroupInfo } from '@components/ProfileBlocks'
import ActivityBlock from '@components/StatBlock/ActivityBlock'
import MemberBlock from '@components/StatBlock/MemberBlock'
import { ArrowRight } from '@components/Table/components/Arrow'
import GroupPlanTable from '@components/Table/GroupPlanTable'
import SocialPostTable from '@components/Table/SocialPostTable'
import { H4 } from '@components/Typography'
import { Plan } from '@dts/Plans'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useGlobalLoading from '@hooks/useGlobalLoading'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import {
  getGroupDetails,
  getSocialMediaPosts,
  GroupDetailType,
} from '@shared/Firebase/group'
import { MemberDataType } from '@shared/Firebase/member'
import { getPlans } from '@shared/Firebase/plan'
import { getReport } from '@shared/Firebase/report'
import { withTrans } from '@shared/I18n'
import Permissions from '@shared/Permissions'
import { message, Spin } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SocialMediaPost } from '../../../dts/Group'
import useOrganisationInfo from '@hooks/useOrganisationInfo'

const ViewAllGroupMemberButton = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Button
      type="secondary"
      className={classNames('w-full sm:w-fit', 'self-end', 'mt-6')}
    >
      <Link href={`${router.asPath}/members`}>
        <a className="flex items-center gap-2">
          {t('view-all')}
          <ArrowRight border={false} />
        </a>
      </Link>
    </Button>
  )
}

const GroupActivities = ({ groupId }: { groupId: string }) => {
  const { t } = useTranslation()
  const [report, setReport] = useState<{
    dailyStreak: number
    totalMessages: number
    totalPrayer: number
    totalGratitude: number
    totalMembers: number
  } | null>(null)

  useEffect(() => {
    const run = async () => {
      const { success, data } = await getReport({
        scope: 'group',
        scopeId: groupId,
      })

      if (success) {
        setReport({
          dailyStreak: data.dailyStreak,
          totalGratitude: data.totalGratitude,
          totalMessages: data.totalMessage,
          totalPrayer: data.totalPrayer || 0,
          totalMembers: data.totalMember,
        })
      } else {
        setReport({
          dailyStreak: 0,
          totalGratitude: 0,
          totalMessages: 0,
          totalPrayer: 0,
          totalMembers: 0,
        })
      }
    }
    if (groupId) {
      run()
    }
  }, [groupId])

  return (
    <div className={classNames('flex-1')}>
      <H4>{t('group.group-activity')}</H4>
      <Spin spinning={report === null}>
        <div
          className={classNames(
            'flex flex-col',
            'justify-between',
            '-ml-2 mr-2'
          )}
        >
          <div className="flex flex-1 flex-row">
            <ActivityBlock
              activityType={t('group.members')}
              count={report?.totalMembers ?? 0}
              textIcon="👥"
            />
            <ActivityBlock
              activityType={t('messages')}
              count={report?.totalMessages ?? 0}
              textIcon="💬"
            />
          </div>
          <div className="flex flex-1 flex-row">
            <ActivityBlock
              activityType={t('prayers')}
              count={report?.totalPrayer ?? 0}
              textIcon="🙏"
            />
            <ActivityBlock
              activityType={t('praise-reports')}
              count={report?.totalGratitude ?? 0}
              textIcon="🎉"
            />
          </div>
        </div>
      </Spin>
    </div>
  )
}

const GroupMembers = ({ members }: { members: MemberDataType[] }) => {
  const { t } = useTranslation()
  return (
    <div className={classNames('flex-1')}>
      <H4>{t('group.members')}</H4>
      <MemberBlock members={members} />
    </div>
  )
}

const GroupPageInfo: NextPageWithLayout = () => {
  const { organisationInfo } = useOrganisationInfo()
  const { t } = useTranslation()
  const { startLoading, stopLoading } = useGlobalLoading()
  const router = useRouter()
  const groupId = router.query['groupId'] as string
  const [groupDetails, setGroupDetails] = useState<GroupDetailType>()
  const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPost[]>(
    []
  )
  const [loading, setLoading] = useState(!!groupId)
  const [plans, setPlans] = useState<Plan[]>([])
  const choosePlanOptionModalRef = useRef<ChoosePlanOptionModalRef>(null)
  const reviewRef = useRef<any>()

  const getGroupDetail = useCallback(async () => {
    try {
      if (groupId) {
        const {
          success,
          data,
          message: errorMessage,
        } = await getGroupDetails({
          groupId,
        })
        if (!success) {
          console.error('get group detail error: ', errorMessage)
          message.error(t('error-server'))
          return
        }
        setGroupDetails(data)
      }
    } finally {
    }
  }, [groupId, t])

  const fetchPlans = async () => {
    try {
      const response = await getPlans({
        campusId: '',
        search: '',
        tab: 'plans',
      })
      if (response?.data) {
        setPlans(response.data)
      }
    } catch (error) {}
  }

  const fetchSocialMediaPosts = async () => {
    const mediaPosts = await getSocialMediaPosts(groupId)
    setSocialMediaPosts(mediaPosts)
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([
        getGroupDetail(),
        fetchPlans(),
        fetchSocialMediaPosts(),
      ])
      setLoading(false)
    } catch (error) {}
  }, [getGroupDetail])

  const onSchedulePlan = () => {
    choosePlanOptionModalRef.current?.show()
  }

  useEffect(() => {
    fetchData()
  }, [groupId, t, getGroupDetail, fetchData])

  useEffect(() => {
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, startLoading, stopLoading])

  useBreadcrumb({
    label: !groupId || !groupDetails ? 'Group detail' : groupDetails.name,
  })

  const deleteGroupModalRef = useRef<DeleteGroupModalRef>(null)
  const groupCreationModalRef = useRef<GroupCreationModalRef>(null)

  const onPressDeleteGroup = useCallback(() => {
    if (!groupDetails) {
      return
    }
    deleteGroupModalRef.current?.show({
      groupId: groupId,
      groupAvatar: groupDetails.image,
      groupName: groupDetails.name,
    })
  }, [groupDetails, groupId])

  const onPressEditGroup = useCallback(() => {
    if (!groupDetails) {
      return
    }
    groupCreationModalRef.current?.show({
      id: groupDetails.id,
      name: groupDetails.name,
      image: groupDetails.image,
      memberCount: groupDetails.members?.length ?? 0,
      leader: { id: groupDetails.leader.uid, name: groupDetails.leader.name },
      permissions: groupDetails.permissions,
      timeZone: Number(groupDetails.timeZone || 0),
      campus: groupDetails.campus,
    })
  }, [groupDetails])

  const onDeleted = () => router.replace('/groups')

  const onSchedulePlanSucceed = (isSuccess: boolean) => {
    if (isSuccess) {
      getGroupDetail()
    }
  }

  if (groupId && !loading && !groupDetails) {
    return <NotFoundPage />
  } else if (!groupId || loading || !groupDetails) {
    return null
  }

  return (
    <PageLayout routeChangeLoading>
      <GroupInfo
        groupDetail={groupDetails}
        onPressDelete={onPressDeleteGroup}
        onPressEdit={onPressEditGroup}
        groupCampus={groupDetails.campus?.name}
      />

      <div
        className={classNames(
          'flex flex-row flex-wrap',
          'justify-between',
          'mt-10'
        )}
      >
        <GroupActivities groupId={groupId} />
        <GroupMembers members={groupDetails.members || []} />
      </div>
      <ViewAllGroupMemberButton />

      {organisationInfo?.enableGeneratePlanFromSermon ? (
        <SocialPostTable
          posts={socialMediaPosts}
          onClick={(plan) => {
            reviewRef.current?.show(plan)
          }}
          group={groupDetails}
        />
      ) : null}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <H4>{t('group.plans')}</H4>
          {(groupDetails.plans || []).length > 0 && plans.length > 0 && (
            <Button type="primary" onClick={onSchedulePlan}>
              {t('group.schedule-plan')}
            </Button>
          )}
        </div>
        <div className="mt-6 mb-8">
          {(groupDetails.plans || []).length === 0 && plans.length === 0 && (
            <GroupPlanBanner
              buttonTitle={t('group.create-plan')}
              onClick={() => {
                router.push('/plans')
              }}
            />
          )}
          {(groupDetails.plans || []).length === 0 && plans.length > 0 && (
            <GroupPlanBanner
              buttonTitle={t('group.schedule-plan')}
              onClick={onSchedulePlan}
            />
          )}
        </div>
        <GroupPlanTable data={groupDetails.plans || []} />
      </div>

      <DeleteGroupModal ref={deleteGroupModalRef} onDeleted={onDeleted} />
      <GroupCreationModal
        ref={groupCreationModalRef}
        onUpdate={getGroupDetail}
      />
      <ChoosePlanModal
        ref={choosePlanOptionModalRef}
        groupId={groupId}
        onPlanSuccess={onSchedulePlanSucceed}
      />
      {organisationInfo?.enableGeneratePlanFromSermon ? (
        <ReviewSocialPostModal ref={reviewRef} />
      ) : null}
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
export default withPagePermissionChecker(GroupPageInfo, {
  // TODO: revert this when server return this permission
  // permissionsRequire: [],
  permissionsRequire: [Permissions.VIEW_GROUP],
  noPermissionView: true,
})
