import { HomeEmpty } from '@components/EmptyStates'
import HelpCenterBlock from '@components/HelpCenterBlock'
import PageLayout from '@components/Layout/PageLayout'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import { withTrans } from '@shared/I18n'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntercom } from 'react-use-intercom'

const HelpCenterPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { show } = useIntercom()

  return (
    <PageLayout
      emptyComponent={<HomeEmpty />}
      title={t('home.help-center-title')}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <HelpCenterBlock
          iconText="💬"
          title={t('home.chat-title')}
          description={t('home.chat-description')}
          onClick={() => {
            show?.()
          }}
        />
        <HelpCenterBlock
          iconText="✉️"
          title={t('home.email-title')}
          description={t('home.email-description')}
          onClick={() => {
            window?.open('mailto:support@carrybible.com')
          }}
        />
        <HelpCenterBlock
          iconText="🎥"
          title={t('home.video-guide-title')}
          description={t('home.video-guide-description')}
          onClick={() =>
            router.replace('https://www.carrybible.com/how-to-use-carry-videos')
          }
        />
      </div>
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default withPagePermissionChecker(HelpCenterPage, {
  permissionsRequire: [],
  noPermissionView: true,
})
