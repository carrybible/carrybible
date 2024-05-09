import Banner from '@components/Banner'
import PageLayout from '@components/Layout/PageLayout'

import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import NotFoundPage from '@pages/404'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import {
  changeRoleAccess,
  getMemberProfile,
  MemberDataType,
  MemberProfileType,
} from '@shared/Firebase/member'
import { withTrans } from '@shared/I18n'
import { message } from 'antd'
import SettingsUserImage from '@assets/images/SettingsUserImage.png'

import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { H4 } from '@components/Typography'
import CampusUserTable from '@components/Table/CampusUserTable'
import MemberDetailSetting from '@components/ProfileBlocks/MemberDetailSetting'
import DeleteMemberAccessModal, {
  DeleteMemberAccessModalRef,
} from '@components/Modals/DeleteMemberAccessModal'
import EditMemberModal, {
  EditMemberModalRef,
} from '@components/Modals/EditMemberModal'
import DashboardRoleSelectionModal, {
  DashboardRoleSelectionModalRef,
} from '@components/Modals/DashboardRoleSelectionModal'
import { User } from '@dts/User'

const EDIT_MEMBER_MODAL_QUERY_KEY = 'detail'

const UserSettings: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const router = useRouter()
  const userId = router.query['userId'] as string
  const [userInfo, setUserInfo] = useState<MemberProfileType | null>(null)
  const deleteMemberAccessModalRef = useRef<DeleteMemberAccessModalRef>(null)
  const editProfileModalRef = useRef<EditMemberModalRef>(null)
  const [loading, setLoading] = useState(!!userId)
  const me = useAppSelector((state) => state.me) as User
  const dashboardRoleSelectionModalRef =
    useRef<DashboardRoleSelectionModalRef>(null)

  useBreadcrumb({
    label: userInfo?.name || 'User',
    previousLabel: '',
  })

  const handleViewDtailProfile = async () => {
    editProfileModalRef.current?.show()
  }

  const handleChangeRole = async () => {
    dashboardRoleSelectionModalRef.current?.show()
  }

  const onPressRemoveAccess = useCallback((user: MemberDataType) => {
    deleteMemberAccessModalRef.current?.show({
      userId: user.uid,
      userAvatar: user.image,
      userName: user.name,
    })
  }, [])

  const handleChangeRoleProcess = async (role: string | undefined) => {
    if (!userInfo || !role) {
      return
    }
    setLoading(true)
    const result = await changeRoleAccess(userInfo.uid, role, me)
    if (result && result.success) {
      message.success(t('members.change-role-success'))
    } else {
      message.error(t('error-server'))
    }
    setLoading(false)
    await fetchUserInfo()
  }

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
    <PageLayout title={t('settings.settings-title')} routeChangeLoading={true}>
      <MemberDetailSetting
        userInfo={userInfo}
        onPressDetail={handleViewDtailProfile}
        handleChangeRole={handleChangeRole}
        handleOnRemoveAccess={(userInfo: MemberDataType) =>
          onPressRemoveAccess(userInfo)
        }
      />
      <Banner
        className="my-6"
        title={
          userInfo.organisation?.role === 'admin' ||
          userInfo.organisation?.role === 'owner'
            ? t('settings.access-to-all-campus')
            : t('settings.title-banner-user')
        }
        content={t('settings.access-to-all-campus-description')}
        image={{
          img: SettingsUserImage,
          imgAlt: 'SettingsUserImage',
          width: 150,
          height: 130,
        }}
      />
      {userInfo.organisation?.role === 'admin' ||
      userInfo.organisation?.role === 'owner' ? (
        ''
      ) : (
        <>
          <H4 className="">{t('settings.permissions-title')}</H4>
          <CampusUserTable userInfo={userInfo} />
        </>
      )}
      <EditMemberModal
        ref={editProfileModalRef}
        userInfo={userInfo}
        queryKey={EDIT_MEMBER_MODAL_QUERY_KEY}
        onUpdateUserInfo={() => fetchUserInfo({ showLoading: false })}
      />
      <DashboardRoleSelectionModal
        ref={dashboardRoleSelectionModalRef}
        handleResult={async (role: string | undefined) =>
          await handleChangeRoleProcess(role)
        }
      />
      <DeleteMemberAccessModal
        ref={deleteMemberAccessModalRef}
        onDeleted={async () =>
          await router.push({
            pathname: `/settings/`,
            query: {
              tab: 'users',
            },
          })
        }
      />
    </PageLayout>
  )
}

export const getServerSideProps = withTrans()
export default withPagePermissionChecker(UserSettings, {
  permissionsRequire: [],
  noPermissionView: true,
})
