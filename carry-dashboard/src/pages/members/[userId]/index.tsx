import PageLayout from '@components/Layout/PageLayout'
import Button from '@components/Button'
import DeleteMemberModal, {
  DeleteMemberModalRef,
} from '@components/Modals/DeleteMemberModal'

import EditMemberModal, {
  EditMemberModalRef,
} from '@components/Modals/EditMemberModal'
import MemberSettingInfo from '@components/ProfileBlocks/MemberSettingInfo'
import ActivityBlock from '@components/StatBlock/ActivityBlock'
import GroupsBlock from '@components/StatBlock/GroupsBlock'
import MemberGivingTable from '@components/Table/MemberGivingTable'
import { H4 } from '@components/Typography'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { LIMIT_IN_PROFILE } from '@shared/Constants'
import {
  getMemberProfile,
  MemberDataType,
  MemberProfileType,
} from '@shared/Firebase/member'
import { getReport } from '@shared/Firebase/report'
import { withTrans } from '@shared/I18n'
// import Permissions from '@shared/Permissions'
import { message, Spin } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowRight } from '@components/Table/components/Arrow'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const MemberActivities = ({ userId }: { userId: string }) => {
  const { t } = useTranslation()
  const [report, setReport] = useState<{
    dailyStreak: number
    totalMessages: number
    totalPrayer: number
    totalGratitude: number
  } | null>(null)

  useEffect(() => {
    const run = async () => {
      const { success, data } = await getReport({
        scope: 'user',
        scopeId: userId,
      })

      if (success) {
        setReport({
          dailyStreak: data.dailyStreak,
          totalGratitude: data.totalGratitude,
          totalMessages: data.totalMessage,
          totalPrayer: data?.totalPrayer || 0,
        })
      } else {
        setReport({
          dailyStreak: 0,
          totalGratitude: 0,
          totalMessages: 0,
          totalPrayer: 0,
        })
      }
    }
    if (userId) run()
  }, [userId])

  return (
    <div className={classNames('flex-1')}>
      <H4>{t('members.member-activity')}</H4>
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
              activityType={t('members.daily-streak')}
              count={report?.dailyStreak ?? 0}
              textIcon="🔥"
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

const MemberGroups = ({
  groups,
  limit,
}: {
  groups: MemberProfileType['groups']
  limit?: number
}) => {
  const { t } = useTranslation()
  return (
    <div className={classNames('flex-1')}>
      <H4>{t('menu.groups')}</H4>
      <GroupsBlock groups={groups} limit={limit} />
    </div>
  )
}

const EDIT_MEMBER_MODAL_QUERY_KEY = 'edit'

const MemberProfile: NextPageWithLayout = () => {
  useBreadcrumb({
    label: 'Profile',
  })
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const router = useRouter()
  const userId = router.query['userId'] as string
  const [userInfo, setUserInfo] = useState<MemberProfileType | null>(null)
  const [loading, setLoading] = useState(!!userId)

  const editProfileModalRef = useRef<EditMemberModalRef>(null)
  const deleteMemberModalRef = useRef<DeleteMemberModalRef>(null)

  const handleEditProfile = async () => {
    editProfileModalRef.current?.show()
  }

  const onPressDeleteMember = useCallback((user: MemberDataType) => {
    deleteMemberModalRef.current?.show({
      userId: user.uid,
      userAvatar: user.image,
      userName: user.name,
    })
  }, [])

  const fetchUserInfo = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (userId) {
        try {
          if (showLoading) {
            setLoading(true)
          }
          const {
            success,
            message: errorMessage,
            data,
          } = await getMemberProfile({
            uid: userId,
          })
          if (!success) {
            console.error('get member profile error: ', errorMessage)
            message.error(t('error-server'))
            return
          }
          setUserInfo(data)
        } finally {
          setLoading(false)
        }
      }
    },
    [t, userId]
  )

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  if (userId && !loading && !userInfo) {
    return <NotFoundPage />
  } else if (!userId || loading || !userInfo) {
    return null
  }

  return (
    <PageLayout routeChangeLoading={true}>
      <MemberSettingInfo
        userInfo={userInfo}
        onPressEdit={handleEditProfile}
        handleOnDelete={(userInfo: MemberDataType) =>
          onPressDeleteMember(userInfo)
        }
      />

      <div
        className={classNames(
          'flex flex-row flex-wrap',
          'justify-between',
          'mt-10'
        )}
      >
        <MemberActivities userId={userId} />
        <MemberGroups groups={userInfo.groups} limit={LIMIT_IN_PROFILE} />
      </div>
      <ViewAllGroupButton />
      <div>
        <H4 className="mt-6 flex-1">{t('giving.donations-header')}</H4>
        <MemberGivingTable userId={userId} />
      </div>

      <EditMemberModal
        ref={editProfileModalRef}
        userInfo={userInfo}
        queryKey={EDIT_MEMBER_MODAL_QUERY_KEY}
        onUpdateUserInfo={() => fetchUserInfo({ showLoading: false })}
      />
      <DeleteMemberModal
        ref={deleteMemberModalRef}
        onDeleted={async () =>
          await router.push({
            pathname: `/members`,
          })
        }
      />
    </PageLayout>
  )
}

const ViewAllGroupButton = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Button
      type="secondary"
      className={classNames('w-full sm:w-fit', 'self-end', 'mt-6')}
    >
      <Link href={`${router.asPath}/groups`}>
        <a className="flex items-center gap-2">
          {t('view-all')}
          <ArrowRight border={false} />
        </a>
      </Link>
    </Button>
  )
}

export const getServerSideProps = withTrans()
export default withPagePermissionChecker(MemberProfile, {
  // TODO: revert this when server return this permission
  permissionsRequire: [],
  // permissionsRequire: [Permissions.VIEW_PROFILE_MEMBER],
  noPermissionView: true,
})
