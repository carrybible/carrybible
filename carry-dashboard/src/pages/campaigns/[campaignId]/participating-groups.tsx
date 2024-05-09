import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { message } from 'antd'
import { useRouter } from 'next/router'

import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import { withTrans } from '@shared/I18n'
import PageLayout from '@components/Layout/PageLayout'
import ParticipatingGroupTable from '@components/Table/ParticipatingGroupTable'
import SearchBox from '@components/SearchBox'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { ParticipatingGroup } from '@redux/slices/group'
import useBreadcrumb from '@hooks/useBreadcrumb'
import { getCampaignDonations } from '@shared/Firebase/campaign'

const ParticipatingGroupsPage = () => {
  const router = useRouter()

  const { startLoading, stopLoading } = useGlobalLoading()

  const { t } = useTranslation()

  const campaignId = router.query.campaignId as string

  const searchTextRef = useRef<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [groups, setGroups] = useState<ParticipatingGroup[]>([])

  useBreadcrumb({
    label: t('giving.participating-groups'),
  })

  const getData = useCallback(async () => {
    setLoading(true)

    const res = await getCampaignDonations<ParticipatingGroup>({
      scope: 'group',
      search: searchTextRef.current,
      filters: { campaignId },
      page: 1,
      limit: 99999,
    })

    setLoading(false)

    if (!res.success) {
      message.error(res.message!)
    } else {
      setGroups(res.data)
    }
  }, [campaignId])

  useEffect(() => {
    if (campaignId) {
      getData()
    }
  }, [campaignId, getData])

  useEffect(() => {
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, startLoading, stopLoading])

  const handleSearchTextChanged = (val: string) => {
    searchTextRef.current = val
  }

  return (
    <PageLayout routeChangeLoading title={t('giving.participating-groups')}>
      <div className="mb-6 flex w-full flex-col justify-between sm:flex-row">
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={t('group.search-groups-text')}
          onChange={(e) => handleSearchTextChanged(e.currentTarget.value)}
          onPressEnter={getData}
          allowClear
        />
      </div>
      <ParticipatingGroupTable
        dataSource={groups}
        className="mt-10"
        campaignId={campaignId}
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
export default withPagePermissionChecker(ParticipatingGroupsPage, {
  permissionsRequire: [],
  noPermissionView: true,
})
