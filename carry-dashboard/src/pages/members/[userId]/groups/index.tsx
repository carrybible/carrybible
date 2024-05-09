import PageLayout from '@components/Layout/PageLayout'
import SearchBox from '@components/SearchBox'
import GroupTable from '@components/Table/GroupTable'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useMemberInfo from '@hooks/useMemberInfo'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { Group } from '@redux/slices/group'
import { getGroups } from '@shared/Firebase/group'
import { withTrans } from '@shared/I18n'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
// TODO: Check permission?
// import Permissions from '@shared/Permissions'
import React, { useCallback, useEffect, useState } from 'react'

const MemberGroupsPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const [listGroup, setListGroup] = useState<Group[]>([])
  const [searchText, setSearchText] = useState('')
  const dispatch = useAppDispatch()
  useBreadcrumb({
    label: 'Groups',
  })
  const router = useRouter()

  const { userId } = router.query as { userId: string }

  const userInfo = useMemberInfo(userId)

  const getData = useCallback(async () => {
    dispatch(startLoading())
    try {
      const groups = (await getGroups({ searchText, memberId: userId }))
        ?.data?.[0]?.data
      setListGroup(groups)
    } catch (error) {
      dispatch(stopLoading())
    }
    dispatch(stopLoading())
  }, [dispatch, searchText, userId])

  const handleSearch = useCallback(() => {
    getData()
  }, [getData])

  useEffect(() => {
    getData()
  }, [])

  const onTableUpdated = () => getData()

  if (!userId) {
    return null
  }

  return (
    <PageLayout
      title={
        userInfo && userInfo.name
          ? `${userInfo.name}'s Groups`
          : 'Groups of Member'
      }
      routeChangeLoading
    >
      <SearchBox
        className="w-full sm:w-2/5"
        placeholder={t('group.search-groups-text')}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onPressEnter={handleSearch}
        allowClear
      />
      <GroupTable
        dataSource={listGroup}
        className="mt-10"
        onTableUpdated={onTableUpdated}
        unEdit={true}
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
export default withPagePermissionChecker(MemberGroupsPage, {
  // TODO: revert this when server return this permission
  permissionsRequire: [],
  // permissionsRequire: [Permissions.VIEW_GROUP],
  noPermissionView: true,
})
