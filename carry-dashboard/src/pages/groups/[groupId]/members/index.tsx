import PageLayout from '@components/Layout/PageLayout'
import MembersTable from '@components/Table/MembersTable'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useGroupName from '@hooks/useGroupName'
import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
import { useRouter } from 'next/router'
// TODO: Check permission?
// import Permissions from '@shared/Permissions'
import React from 'react'

const GroupMembersPage: NextPageWithLayout = () => {
  useBreadcrumb({
    label: 'Members',
  })
  const router = useRouter()

  const { groupId } = router.query as { groupId: string }

  const groupName = useGroupName(groupId)

  if (!groupId) {
    return null
  }

  return (
    <PageLayout
      title={groupName ? `${groupName} Members` : 'Team Members'}
      routeChangeLoading
    >
      <MembersTable scope="group" scopeId={groupId} />
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
export default withPagePermissionChecker(GroupMembersPage, {
  // TODO: revert this when server return this permission
  permissionsRequire: [],
  // permissionsRequire: [Permissions.VIEW_GROUP],
  noPermissionView: true,
})
