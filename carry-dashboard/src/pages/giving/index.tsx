import DownloadSimple from '@assets/icons/DownloadSimple.svg'
import Button from '@components/Button'
import { HomeEmpty } from '@components/EmptyStates'
import PageLayout from '@components/Layout/PageLayout'
import { GivingCampaignTab } from '@components/Pages/Giving/Tabs/Campaign'
import DonationsTab from '@components/Pages/Giving/Tabs/DonationsTab'
import {
  GivingOverviewTab,
  GivingReportType,
} from '@components/Pages/Giving/Tabs/Overview'
import { GivingTithingTab } from '@components/Pages/Giving/Tabs/Tithing'
import { TabPane } from '@components/Tabs'
import { H4 } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { updateGiving } from '@redux/slices/giving'
import { ROLE_BASE } from '@shared/Constants'
import { exportDonation } from '@shared/Firebase/donation'
import { getGivingOverviewReport } from '@shared/Firebase/giving'
import { getCurrencies } from '@shared/Firebase/settings'
import { withTrans } from '@shared/I18n'
import Permissions from '@shared/Permissions'
import { Tabs } from 'antd'
import classNames from 'classnames'
import { values } from 'lodash'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import withPagePermissionChecker from '../../hoc/withPagePermissionChecker'

const GivingPage: NextPage = () => {
  const me = useAppSelector((state) => state.me)
  const showEmptyState = useAppSelector((state) => state.home.showEmptyState)
  const { t } = useTranslation()

  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [reportData, setReportData] = useState<any>(null)
  const router = useRouter()
  const [filterGiving, setFilterGiving] = useState('')
  const [header, setHeader] = useState<string>(t('giving.overview-header'))
  const [overviewData, setOverviewData] = useState<GivingReportType>({
    totalFunds: 0,
    totalFundsIncreasedPercent: 0,
    totalDonorsIncrease: 0,
    totalDonors: 0,
    totalFundsOvertime: undefined,
  })
  const giving = useAppSelector((state) => state.giving)
  const organisation = useAppSelector((state) => state.organisation.info)

  useEffect(() => {
    if (
      (organisation &&
        (!organisation.giving?.isConnected ||
          !organisation.giving?.allowSetup)) ||
      ((me.permission?.length || 0) > 0 &&
        !me.permission.includes(Permissions.VIEW_DASHBOARD_GIVING))
    ) {
      router.replace('/')
    }
  }, [
    organisation,
    organisation?.billing?.enabled,
    router,
    me.uid,
    me.permission,
  ])

  const currentCurrency = useMemo(
    () => giving.settingCurrencies?.[currency || ''],
    [currency, giving.settingCurrencies]
  )

  const showTabs = ['owner', 'admin'].includes(me.organisation.role ?? '')

  const activeTab = router.query.tab as string | undefined
  const setActiveTab = useCallback(
    (key: string) => {
      if (key === 'overview') {
        setFilterGiving('overview')
        setHeader(t('giving.overview-header'))
      }
      if (key === 'campaigns') {
        setFilterGiving('campaigns')
        setHeader(t('giving.campaigns-header'))
      }
      if (key === 'tithing') {
        setFilterGiving('tithing')
        setHeader(t('giving.tithing-header'))
      }
      if (key === 'donations') {
        setFilterGiving('donations')
        setHeader(t('giving.donations-header'))
      }
      router.replace(
        {
          query: {
            ...router.query,
            tab: key,
          },
        },
        undefined,
        {
          shallow: true,
        }
      )
    },
    [router, t]
  )

  const onChangeTab = (key: string) => {
    if (key !== activeTab) {
      setActiveTab(key)
    }
  }

  const onExportClick = async () => {
    dispatch(startLoading())
    try {
      const urlLink = (await exportDonation({}))?.data?.urlDownload
      if (urlLink) {
        window.open(urlLink)
      }
      dispatch(stopLoading())
    } catch (error) {
      dispatch(stopLoading())
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (filterGiving === 'overview') {
      const response = await getGivingOverviewReport()
      setReportData(response.data)
      setOverviewData({
        ...(response.data?.find((q: any) => q.currency === currency) ?? {}),
        symbol: currentCurrency?.symbol,
      })
      dispatch(
        updateGiving({
          currentCurrenciesGiving: currency,
        })
      )
      setLoading(false)
    }
  }, [filterGiving])

  useEffect(() => {
    setOverviewData(reportData?.find((q: any) => q.currency === currency) ?? {})
    setOverviewData({
      ...(reportData?.find((q: any) => q.currency === currency) ?? {}),
      symbol: currentCurrency?.symbol,
    })
  }, [currency, currentCurrency?.symbol, reportData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const fetchCurrency = async () => {
      const currencies = await getCurrencies()
      dispatch(
        updateGiving({
          currencies: values(currencies),
          settingCurrencies: currencies,
        })
      )
    }
    fetchCurrency()
  }, [])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  useEffect(() => {
    if (showTabs) {
      setActiveTab(activeTab || 'overview')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTabs])

  return (
    <PageLayout
      isEmpty={showEmptyState}
      emptyComponent={<HomeEmpty />}
      title={t('giving.giving-title')}
    >
      <div>
        {showTabs && (
          <Tabs activeKey={activeTab} onChange={onChangeTab}>
            <TabPane tab={t('giving.overview-tab')} key="overview">
              {filterGiving === 'overview' && (
                <>
                  <H4 className="mt-6">{header}</H4>
                  <GivingOverviewTab
                    data={overviewData}
                    setCurrency={setCurrency}
                    currency={currency}
                  />
                </>
              )}
            </TabPane>
            <TabPane tab={t('giving.campaigns-tab')} key="campaigns">
              {filterGiving === 'campaigns' && (
                <>
                  <H4 className="mt-6">{header}</H4>
                  <GivingCampaignTab />
                </>
              )}
            </TabPane>
            <TabPane tab={t('giving.tithing-tab')} key="tithing">
              {filterGiving === 'tithing' && (
                <>
                  <H4 className="mt-6">{header}</H4>
                  <GivingTithingTab />
                </>
              )}
            </TabPane>
            <TabPane tab={t('giving.donations-tab')} key="donations">
              {filterGiving === 'donations' && (
                <>
                  <div
                    className={classNames(
                      'w-full',
                      'mb-6 flex flex-row items-center'
                    )}
                  >
                    <H4 className="mt-6 flex-1">{header}</H4>
                    {me.organisation.role === ROLE_BASE.OWNER ? (
                      <Button
                        type="secondary"
                        className={classNames('flex-2 mt-2')}
                        onClick={async () => {
                          await onExportClick()
                        }}
                        icon={
                          <Image src={DownloadSimple} alt="download-simple" />
                        }
                      >
                        {t('export-as-csv')}
                      </Button>
                    ) : null}
                  </div>

                  <DonationsTab />
                </>
              )}
            </TabPane>
          </Tabs>
        )}
      </div>
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default withPagePermissionChecker(GivingPage, {
  permissionsRequire: [],
  noPermissionView: true,
})
