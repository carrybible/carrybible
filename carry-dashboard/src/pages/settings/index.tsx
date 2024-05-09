import PageLayout from '@components/Layout/PageLayout'
import BillingTab from '@components/Pages/Settings/BillingTab'
import CampusesTab from '@components/Pages/Settings/CampusesTab'
import IntegrationsTab from '@components/Pages/Settings/IntegrationsTab'
import UsersTab from '@components/Pages/Settings/UsersTab'

import Tabs, { TabPane } from '@components/Tabs'
import { NextPageWithLayout } from '@pages/_app'
import { useAppSelector } from '@redux/hooks'
import { withTrans } from '@shared/I18n'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

const SettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const activeTab = router.query.tab as 'string' | undefined
  const me = useAppSelector((state) => state.me)
  const organisation = useAppSelector((state) => state.organisation.info)

  const setActiveTab = useCallback((key: string) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeTab) {
      // Redirect to active tab
      if (organisation?.settings?.showUsers !== false)
        return setActiveTab('users')
      if (['owner', 'admin'].includes(me.organisation?.role || '')) {
        if (organisation?.settings?.showCampuses !== false)
          return setActiveTab('campuses')
        if (organisation.billing?.enabled && organisation.billing?.url)
          return setActiveTab('billing')
        if (organisation.giving?.allowSetup) return setActiveTab('integrations')
      }
    }
  }, [
    setActiveTab,
    activeTab,
    organisation?.settings?.showUsers,
    organisation?.settings?.showCampuses,
    organisation?.billing?.enabled,
    organisation?.billing?.url,
    organisation?.giving?.allowSetup,
    me.organisation?.role,
  ])

  const onChangeTab = (key: string) => setActiveTab(key)
  return (
    <PageLayout title={t('settings.settings-title')} routeChangeLoading>
      <Tabs activeKey={activeTab} onChange={onChangeTab}>
        {organisation?.settings?.showUsers === false ? null : (
          <TabPane tab={t('settings.users-tab')} key="users">
            <UsersTab />
          </TabPane>
        )}

        {me.organisation?.role === 'admin' ||
        me.organisation?.role === 'owner' ? (
          <>
            {organisation?.settings?.showCampuses === false ? null : (
              <TabPane tab={t('settings.campuses-tab')} key="campuses">
                <CampusesTab />
              </TabPane>
            )}

            {organisation?.billing?.enabled && organisation?.billing?.url && (
              <TabPane tab={t('settings.billing-tab')} key="billing">
                <BillingTab />
              </TabPane>
            )}

            {organisation?.giving?.allowSetup &&
            me.permission.includes('connect-stripe') ? (
              <TabPane tab={t('settings.integrations-tab')} key="integrations">
                <IntegrationsTab />
              </TabPane>
            ) : null}
          </>
        ) : null}
      </Tabs>
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default SettingsPage
