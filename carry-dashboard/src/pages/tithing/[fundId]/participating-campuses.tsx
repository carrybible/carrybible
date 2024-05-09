import { useTranslation } from 'next-i18next'

import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import { withTrans } from '@shared/I18n'
import PageLayout from '@components/Layout/PageLayout'
import SearchBox from '@components/SearchBox'
import useBreadcrumb from '@hooks/useBreadcrumb'
import { useCallback, useEffect, useRef, useState } from 'react'
import ParticipatingCampusesTable from '@components/Table/ParticipatingCampusesTable'
import { useRouter } from 'next/router'
import useTithingFundDetailData from '@hooks/useTithingFundDetailData'
import {
  GetDonationType,
  getTithingDonations,
  ParticipatingCampuses,
} from '@shared/Firebase/giving'
import { useAppDispatch } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'

const ParticipatingCampusesPage = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const fundId = router.query['fundId'] as string
  const [campuses, setCampuses] = useState<ParticipatingCampuses[]>()
  const [filters, setFilters] = useState<GetDonationType>({
    search: '',
    // limit: 12,
    scope: 'campus',
    filters: {
      fundId: fundId,
    },
  })

  const [loading, setLoading] = useState(false)

  const searchRef = useRef('')

  const { fund } = useTithingFundDetailData({
    fundId,
  })

  useBreadcrumb({
    label: t('giving.participating-campuses'),
    previousLabel: fund?.name,
  })

  const handleChangeSearch = () => {
    setFilters({ ...filters, search: searchRef.current || '' })
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTithingDonations({ ...filters })
      setCampuses(res?.data)
    } catch (error) {}
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  return (
    <PageLayout routeChangeLoading title={t('giving.participating-campuses')}>
      <div className="mb-6 flex w-full flex-col justify-between sm:flex-row">
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={t('giving.search-campuses')}
          onChange={(e) => {
            searchRef.current = e.target.value
          }}
          onPressEnter={handleChangeSearch}
          allowClear
        />
      </div>
      <ParticipatingCampusesTable
        data={campuses || []}
        fundId={fundId}
        className="mt-10"
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
export default withPagePermissionChecker(ParticipatingCampusesPage, {
  permissionsRequire: [],
  noPermissionView: true,
})
