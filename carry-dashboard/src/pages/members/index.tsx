import PageLayout from '@components/Layout/PageLayout'
import MembersTable from '@components/Table/MembersTable'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { cacheMembersData } from '@redux/slices/members'
import { withTrans } from '@shared/I18n'
import Permissions from '@shared/Permissions'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { MembersScopeType } from '@shared/Firebase/member'

const MembersPage: NextPageWithLayout = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { cacheData: initData } = useAppSelector((state) => state.members)
  const me = useAppSelector((state) => state.me)

  const scope = useMemo<{
    scopeType: MembersScopeType
    scopeId: string
  }>(() => {
    if (['admin', 'owner'].includes(me?.organisation?.role || '')) {
      return {
        scopeType: 'organisation',
        scopeId: me.organisation.id,
      }
    }
    if (
      ['campus-leader', 'campus-user'].includes(me?.organisation?.role || '')
    ) {
      return {
        scopeType: 'campus',
        scopeId: me.organisation.id,
      }
    }
    return {
      scopeType: 'organisation',
      scopeId: me.organisation.id,
    }
  }, [me])

  return (
    <PageLayout title={t('members.member-title')} routeChangeLoading>
      <MembersTable
        scope={scope?.scopeType}
        scopeId={scope?.scopeId || ''}
        initData={initData}
        onSync={(data) => dispatch(cacheMembersData(data))}
      />
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default withPagePermissionChecker(MembersPage, {
  permissionsRequire: [Permissions.VIEW_DASHBOARD_MEMBERS],
  noPermissionView: true,
})
