import Button from '@components/Button'
import Pencil from '@assets/icons/Pencil.svg'
import Key from '@assets/icons/Key.svg'
import Pause from '@assets/icons/PauseCircleIcon.svg'
import Play from '@assets/icons/PlayCircleIcon.svg'
import PageLayout from '@components/Layout/PageLayout'
import { FundReport } from '@components/Pages/Giving/FundReport'
import TithingInfo from '@components/ProfileBlocks/TithingInfo'
import { ArrowRight } from '@components/Table/components/Arrow'
import { H4, H5, Text } from '@components/Typography'
import { TithingFundDetail } from '@dts/Giving'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import {
  CampusBlockType,
  DonationOfUser,
  getTithingDonations,
  getTithingFundDetail,
  updateStatusTithingFund,
} from '@shared/Firebase/giving'
import { withTrans } from '@shared/I18n'
import classNames from 'classnames'
import { capitalize } from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CampusBlock from '@components/StatBlock/CampusBlock'
import { GivingReportType } from '@components/Pages/Giving/Tabs/Overview'
import TithingFundDonationsTable from '@components/Table/TithingFundDonations'
import ChooseCampusModal, {
  ChooseCampusModalRef,
} from '@components/Modals/Giving/ChooseCampusModal'
import CreateTithingFundModal, {
  CreateTithingFundModalRef,
} from '@components/Modals/Giving/CreateTithingFundModal'
import SuggestedGiftModal, {
  SuggestedGiftModalRef,
} from '@components/Modals/Giving/SuggestedGiftModal'
import { message } from 'antd'

const ViewAllParticipatingButton = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Button
      type="secondary"
      className={classNames('w-full sm:w-fit', 'self-end', 'mt-6')}
    >
      <Link href={`${router.asPath}/participating-campuses`}>
        <a className="flex items-center gap-2">
          {t('view-all')}
          <ArrowRight border={false} />
        </a>
      </Link>
    </Button>
  )
}

const TithingActivities = ({
  campuses,
  report,
}: {
  campuses: CampusBlockType[] | undefined
  report: GivingReportType
}) => {
  return (
    <div className={classNames('mt-10 flex flex-col')}>
      <div className="flex flex-col sm:flex-row sm:space-x-5">
        <div className="flex-1">
          <FundReport data={report} />
        </div>
        <div
          className={classNames(
            'flex flex-1 flex-row flex-wrap',
            'justify-between pt-10 sm:pt-0'
          )}
        >
          <TithingParticipatingCampuses campuses={campuses || []} />
        </div>
      </div>
    </div>
  )
}

const TithingParticipatingCampuses = ({
  campuses,
}: {
  campuses: CampusBlockType[]
}) => {
  const { t } = useTranslation()
  return (
    <div className={classNames('flex-1')}>
      <H4>{t('giving.participating-campuses')}</H4>
      <CampusBlock campuses={campuses} />
    </div>
  )
}

const GroupPageInfo: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me)
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createTithingFundModalRef = useRef<CreateTithingFundModalRef>(null)
  const suggestedGiftModalRef = useRef<SuggestedGiftModalRef>(null)
  const chooseCampusModalRef = useRef<ChooseCampusModalRef>(null)

  const fundId = router.query['fundId'] as string
  const [fund, setFund] = useState<TithingFundDetail>()
  const [donations, setDonations] = useState<DonationOfUser[]>([])
  const [isForceFetch, setIsForceFetch] = useState(false)

  const giving = useAppSelector((state) => state.giving)
  const currency = useMemo(
    () => giving.settingCurrencies?.[fund?.currency || ''],
    [fund, giving.settingCurrencies]
  )

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
      danger?: boolean
    }[] = []

    actions.push({
      key: 'edit-fund-details',
      label: t('giving.edit-fund-details'),
      icon: <Image src={Pencil} alt="edit-detail-icon" />,
      danger: false,
    })
    if (['admin', 'owner'].includes(me?.organisation?.role ?? '')) {
      actions.push({
        key: 'edit-campus-access',
        label: t('giving.campus-access'),
        icon: <Image src={Key} alt="edit-campus-icon" />,
        danger: false,
      })
    }
    if (['owner'].includes(me?.organisation?.role ?? '')) {
      actions.push({
        key: 'toggle-status-fund',
        label:
          fund?.status === 'inactive'
            ? t('giving.resume-fund')
            : t('giving.pause-fund'),
        icon: (
          <Image
            src={fund?.status === 'inactive' ? Play : Pause}
            alt="edit-campus-icon"
          />
        ),
        danger: false,
      })
    }
    return actions
  }, [t, me?.organisation?.role, fund?.status])

  const infoBlocks = [
    <div key={1} className="flex flex-1 flex-col">
      <H5>{t('giving.fund-description')}</H5>
      <Text className="text-neutral-80">{fund?.description}</Text>
    </div>,
  ]

  const onPressEditFund = useCallback((fund: TithingFundDetail | undefined) => {
    createTithingFundModalRef.current?.show(fund, 'edit')
  }, [])

  const onPressCampusAccessFund = useCallback(
    (fund: TithingFundDetail | undefined) => {
      chooseCampusModalRef.current?.show(fund)
    },
    []
  )

  const onPressToggleStatus = async () => {
    try {
      if (fund?.id) {
        setLoading(true)
        const success = await updateStatusTithingFund({
          fund: {
            id: fund.id,
            status: fund.status === 'inactive' ? 'active' : 'inactive',
          },
        })
        if (!success) {
          message.error(t('error-server'))
          setIsForceFetch(true)
          setLoading(false)
          return
        }
        setIsForceFetch(true)
        setLoading(false)
        message.success(t('giving.fund-updated'))
      }
    } catch (error) {
      setIsForceFetch(true)
      setLoading(false)
    }
  }

  useBreadcrumb({
    label: !fundId || !fund ? 'Tithing fund detail' : fund.name,
  })

  useEffect(() => {
    const fetchFundDetail = async () => {
      setLoading(true)
      const response = await getTithingFundDetail(fundId)
      setFund(response.data)
      setIsForceFetch(false)
    }
    if (fundId || (isForceFetch && fundId)) {
      fetchFundDetail()
    }
  }, [fundId, isForceFetch])

  const fetchSubData = useCallback(async () => {
    setLoading(true)
    const res = await getTithingDonations({ filters: { fundId } })
    setLoading(false)
    if (res?.data) {
      setDonations(res.data)
    }
  }, [fundId])

  useEffect(() => {
    if (fundId && fund?.name) {
      fetchSubData()
    }
  }, [fetchSubData, fund?.name, fundId, isForceFetch])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  return (
    <PageLayout title={t('giving.giving-title')} routeChangeLoading>
      <TithingInfo
        avatar={fund?.image}
        name={fund?.name}
        columns={infoBlocks}
        description={capitalize(fund?.status || '')}
        buttonMore={{
          data: buttonMoreData,
          onClick: ({ key }) => {
            if (key === 'edit-fund-details') {
              onPressEditFund(fund)
            }
            if (key === 'edit-campus-access') {
              onPressCampusAccessFund(fund)
            }
            if (key === 'toggle-status-fund') {
              onPressToggleStatus()
            }
          },
        }}
      />
      <TithingActivities
        campuses={fund?.campuses}
        report={{
          totalFunds: fund?.totalFunds || 0,
          totalFundsIncreasedPercent: fund?.totalFundsIncreasedPercent || 0,
          totalDonors: fund?.donorIds?.length || 0,
          totalDonorsIncrease: fund?.totalDonorsIncrease || 0,
          symbol: currency?.symbol,
        }}
      />
      <ViewAllParticipatingButton />
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <H4>{t('giving.tithing-donations')}</H4>
        </div>
        <TithingFundDonationsTable data={donations} />
      </div>
      <CreateTithingFundModal
        ref={createTithingFundModalRef}
        onChooseCampus={chooseCampusModalRef?.current?.show!}
        onChooseSuggestedGift={async () => {
          return await suggestedGiftModalRef?.current?.show(
            fund?.suggestionAmounts
          )
        }}
        callbackUpdated={() => {
          setIsForceFetch(true)
        }}
      />
      <SuggestedGiftModal ref={suggestedGiftModalRef} />
      <ChooseCampusModal
        mode="edit"
        callbackUpdated={() => {
          setIsForceFetch(true)
        }}
        ref={chooseCampusModalRef}
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
export default withPagePermissionChecker(GroupPageInfo, {
  // TODO: revert this when server return this permission
  permissionsRequire: [],
  // permissionsRequire: [Permissions.VIEW_GROUP],
  noPermissionView: true,
})
