import _ from 'lodash'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { message } from 'antd'
import { useRouter } from 'next/router'
import classNames from 'classnames'

import { Text } from '@components/Typography'
import { Campaign, CampaignStatus } from '@dts/Campaign'
import SearchBox from '@components/SearchBox'
import Button from '@components/Button'
import CreateCampaignModal, {
  CreateCampaignModalRef,
} from '@components/Modals/Giving/CreateCampaignModal'
import SuggestedGiftModal, {
  SuggestedGiftModalRef,
} from '@components/Modals/Giving/SuggestedGiftModal'
import SetGoalAmountCampaignModal, {
  SetGoalAmountCampaignModalRef,
} from '@components/Modals/Giving/SetGoalAmountCampaignModal'
import Select from '@components/Select'
import { CampaignEmpty } from '@components/EmptyStates'
import { useAppSelector } from '@redux/hooks'
import { getCampaigns } from '@shared/Firebase/campaign'
import useGlobalLoading from '@hooks/useGlobalLoading'

import IcPlus from '@assets/icons/Plus.svg'

import { CampaignList } from '../CampaignList'

export const GivingCampaignTab = () => {
  const { t } = useTranslation()

  const router = useRouter()

  const me = useAppSelector((state) => state.me)

  const { startLoading, stopLoading } = useGlobalLoading()

  const createCampaignModalRef = useRef<CreateCampaignModalRef>(null)
  const suggestedGiftModalRef = useRef<SuggestedGiftModalRef>(null)
  const setGoalAmountCampaignModalRef =
    useRef<SetGoalAmountCampaignModalRef>(null)

  const searchTextRef = useRef<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [emptyState, setEmptyState] = useState<{
    isFirstTimeLoaded: boolean
    campaigns: boolean
  }>({
    isFirstTimeLoaded: false,
    campaigns: false,
  })

  const [filteringStatus, setFilteringStatus] = useState<CampaignStatus>(
    CampaignStatus.all
  )
  const [filteringCampus, setFilteringCampus] = useState<string>('')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const getData = useCallback(async () => {
    setLoading(true)

    const res = await getCampaigns({
      search: searchTextRef.current,
      status: filteringStatus,
      campusId: filteringCampus,
    })

    setLoading(false)

    if (!res.success) {
      message.error(res.message!)
    } else {
      setCampaigns(res.data || [])
    }

    setEmptyState((es) => {
      return {
        isFirstTimeLoaded: true,
        campaigns: es.campaigns || res.data.length > 0,
      }
    })
  }, [filteringCampus, filteringStatus])

  useEffect(() => {
    getData()
  }, [getData])

  useEffect(() => {
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, startLoading, stopLoading])

  const getCampusOptions = useMemo(() => {
    const options: {
      key: string
      label: string
      value: string
    }[] = [
      {
        key: '1',
        label: 'All',
        value: '',
      },
    ]

    if (
      !_.isNil(me) &&
      !_.isNil(me.campusAccess) &&
      !_.isEmpty(me.campusAccess)
    ) {
      _.forEach(me.campusAccess, (e) => {
        options.push({
          key: e.id,
          label: e.name || e.id,
          value: e.id,
        })
      })
    }

    return options
  }, [me])

  const handleSearchTextChanged = (val: string) => {
    searchTextRef.current = val
  }

  return (
    <div className="my-6">
      {emptyState.isFirstTimeLoaded && !emptyState.campaigns ? (
        <CampaignEmpty
          onClick={() => createCampaignModalRef.current!.show('create')}
        />
      ) : (
        <>
          <div className="mb-6 flex w-full flex-col justify-between sm:flex-row">
            <SearchBox
              className="w-full sm:w-2/5"
              placeholder={t('giving.search-campaigns')}
              onChange={(e) => handleSearchTextChanged(e.currentTarget.value)}
              onPressEnter={getData}
              allowClear
            />
            <Button
              className="flex: 1 mt-6 flex h-fit items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
              icon={
                <div className="mr-1 flex">
                  <Image src={IcPlus} alt="plus-icon" width={15} height={15} />
                </div>
              }
              onClick={() => createCampaignModalRef.current!.show('create')}
            >
              {t('giving.create-campaign')}
            </Button>
          </div>
          <div
            className={classNames('w-full', 'mb-6 flex flex-row items-center')}
          >
            <Text className="mr-2 text-neutral-80">
              {t('giving.campaign')}:
            </Text>
            <Select
              className="min-w-1/5 sm:w-1/5"
              options={[
                {
                  key: CampaignStatus.all,
                  label: 'All',
                  value: CampaignStatus.all,
                },
                {
                  key: CampaignStatus.active,
                  label: 'Active',
                  value: CampaignStatus.active,
                },
                {
                  key: CampaignStatus.ended,
                  label: 'Ended',
                  value: CampaignStatus.ended,
                },
                {
                  key: CampaignStatus.draft,
                  label: 'Draft',
                  value: CampaignStatus.draft,
                },
              ]}
              value={filteringStatus}
              onChange={(value: CampaignStatus) => {
                setFilteringStatus(value)
              }}
            />

            <Text className="px-2 text-neutral-80">{t('campus')}:</Text>
            <Select
              className="min-w-1/5 sm:w-1/5"
              options={getCampusOptions}
              value={filteringCampus}
              onChange={(value: string) => {
                setFilteringCampus(value)
              }}
            />
          </div>
        </>
      )}
      {emptyState.campaigns && <CampaignList campaigns={campaigns} />}
      <CreateCampaignModal
        ref={createCampaignModalRef}
        onChooseSuggestedGift={suggestedGiftModalRef.current?.show}
        onSetGoalAmount={setGoalAmountCampaignModalRef.current?.show}
        onFinish={(id) => router.push(`/campaigns/${id}`)}
      />
      <SuggestedGiftModal ref={suggestedGiftModalRef} />
      <SetGoalAmountCampaignModal ref={setGoalAmountCampaignModalRef} />
    </div>
  )
}
