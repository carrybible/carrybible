import AnnouncementImage from '@assets/images/AnnouncementImage.png'
import Banner from '@components/Banner'
import LineChart from '@components/Chart/LineChart'
import { HomeEmpty } from '@components/EmptyStates'
import PageLayout from '@components/Layout/PageLayout'
import RectangleStatBlock from '@components/StatBlock/RectangleStatBlock'
import SquareStatBlock from '@components/StatBlock/SquareStatBlock'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import Permissions from '@shared/Permissions'

import { fetchReport } from '@redux/thunks/home'
import { withTrans } from '@shared/I18n'
import { formatNumberThousand } from '@shared/Utils'
import classNames from 'classnames'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useRef } from 'react'
import TourWelcomeModal, {
  TourWelcomeModalRef,
} from '@components/Modals/TourWelcomeModal'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'

const HomePage: NextPage = () => {
  const me = useAppSelector((state) => state.me)
  const homeData = useAppSelector((state) => state.home.data)
  const showEmptyState = useAppSelector((state) => state.home.showEmptyState)
  const { t } = useTranslation()
  const { startLoading, stopLoading } = useGlobalLoading()
  const dispatch = useAppDispatch()
  const listGroup = useAppSelector((state) => state.group.listGroup)
  const tourWelcomeModalRef = useRef<TourWelcomeModalRef>(null)

  const getData = useCallback(async () => {
    await dispatch(fetchReport()).unwrap()
  }, [dispatch])

  useEffect(() => {
    getData()
  }, [getData])

  useEffect(() => {
    if (me?.timeZone && !me.dashboardOnboarding?.welcome) {
      tourWelcomeModalRef.current?.show()
    }
  }, [listGroup, me])

  return (
    <PageLayout
      isEmpty={showEmptyState}
      emptyComponent={<HomeEmpty />}
      title={t('home.welcome', { nameValue: me.displayName ?? me.name })}
    >
      <div>
        <Banner
          hidden
          title={t('home.banner-title')}
          content={t('home.banner-content')}
          btnTitle={t('home.banner-btn-title')}
          image={{
            img: AnnouncementImage,
            imgAlt: 'AnnouncementImage',
            width: 250,
            height: 200,
          }}
          className="mb-6"
          onClick={() => {
            startLoading()
            setTimeout(stopLoading, 1000)
          }}
        />
        <div
          className={classNames(
            'flex flex-row flex-wrap items-center justify-between gap-y-6'
          )}
        >
          <SquareStatBlock
            stat={formatNumberThousand(homeData?.totalPrayer ?? 0, 1)}
            title={t('home.prayers')}
            users={homeData?.prayerUsers}
          />
          <SquareStatBlock
            stat={formatNumberThousand(homeData?.totalGratitude ?? 0, 1)}
            title={t('home.praise-reports')}
            users={homeData?.gratitudeUsers}
          />
          <SquareStatBlock
            stat={formatNumberThousand(homeData?.totalMessage ?? 0, 1)}
            title={t('home.messages-sent')}
            users={homeData?.messageUsers}
          />
          <SquareStatBlock
            stat={formatNumberThousand(homeData?.totalMinute ?? 0, 1)}
            title={t('home.reading-time')}
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-y-6 gap-x-4">
          <div className="flex flex-1 flex-col gap-y-6">
            <RectangleStatBlock
              stat={homeData?.totalMember ?? 0}
              title={t('home.total-members')}
              growUnit={`${homeData?.increaseUserPercent ?? 0} %`}
            />
            <RectangleStatBlock
              stat={homeData?.totalGroup ?? 0}
              title={t('home.total-groups')}
              growUnit={`${homeData?.increaseGroup ?? 0} new`}
            />
          </div>
          <LineChart
            title={t('home.total-members-chart-title')}
            className="min-h-[300px] w-full lg:w-[500px]"
            data={homeData?.memberGrowth}
          />
        </div>
      </div>
      <TourWelcomeModal ref={tourWelcomeModalRef} />
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default withPagePermissionChecker(HomePage, {
  permissionsRequire: [Permissions.VIEW_DASHBOARD],
  noPermissionView: true,
})
