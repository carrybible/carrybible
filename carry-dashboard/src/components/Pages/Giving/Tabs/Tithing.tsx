import Button from '@components/Button'
import { TithingEmpty } from '@components/EmptyStates'
import Image from 'next/image'
import Plus from '@assets/icons/Plus.svg'
import Downline from '@assets/icons/Downline.svg'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import FundList from '../FundList'
import { useTranslation } from 'next-i18next'
import SearchBox from '@components/SearchBox'
import classNames from 'classnames'
import { TithingFund } from '@dts/Giving'
import { startLoading, stopLoading } from '@redux/slices/app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { getTithingFunds } from '@shared/Firebase/giving'
import Select from '@components/Select'
import { getCampuses } from '@shared/Firebase/campus'
import { Text } from '@components/Typography'
import ChooseCampusModal, {
  ChooseCampusModalRef,
} from '@components/Modals/Giving/ChooseCampusModal'
import CreateTithingFundModal, {
  CreateTithingFundModalRef,
} from '@components/Modals/Giving/CreateTithingFundModal'
import SuggestedGiftModal, {
  SuggestedGiftModalRef,
} from '@components/Modals/Giving/SuggestedGiftModal'

interface FundFilter {
  search?: string | null
  status?: 'active' | 'inactive' | null
  campusId?: string
  limit?: number
  page?: number
}

const statusOptions = [
  { key: 'all', label: 'All', value: '' },
  { key: 'active', label: 'Active', value: 'active' },
  { key: 'inactive', label: 'Inactive', value: 'inactive' },
]

export const GivingTithingTab = () => {
  const me = useAppSelector((state) => state.me)
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [emptyState, setEmptyState] = useState({
    isFirstTimeLoaded: false,
    funds: false,
  })
  const [campusOptions, setCampusOptions] = useState<any>([])

  const [filter, setFilter] = useState<FundFilter>({
    search: null,
    status: null,
  })
  const [funds, setFunds] = useState<TithingFund[]>()
  const searchRef = useRef('')

  const createTithingFundModalRef = useRef<CreateTithingFundModalRef>(null)
  const suggestedGiftModalRef = useRef<SuggestedGiftModalRef>(null)
  const chooseCampusModalRef = useRef<ChooseCampusModalRef>(null)

  const onCreate = useCallback(() => {
    createTithingFundModalRef.current?.show()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const response = await getTithingFunds({ ...filter })
    setFunds(response.data)
    setEmptyState((_emptyState) => {
      const updateEmptyState = {
        funds: _emptyState.funds || response.data.length > 0,
      }
      return { isFirstTimeLoaded: true, ...updateEmptyState }
    })
    setLoading(false)
  }, [filter])

  const handleChangeSearch = () => {
    setFilter({ ...filter, search: searchRef.current || null })
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    async function fetchData() {
      const searchData = await getCampuses({
        search: '',
        organisationId: me.organisation.id,
        limit: 999999999,
        page: 1,
      })

      const list = [
        {
          key: 'options-all',
          label: 'All',
          value: '',
          image: '',
        },
        ...searchData.data.map((item) => ({
          key: item.id || '',
          label: item.name || item.id,
          value: item.id,
          image: item.image || '',
        })),
      ]

      setCampusOptions(list)
    }
    fetchData()
  }, [me.organisation.id])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  return (
    <div className="mt-6 flex flex-wrap justify-between gap-y-6 gap-x-4">
      {emptyState.isFirstTimeLoaded && !emptyState.funds ? (
        <TithingEmpty onClick={onCreate} />
      ) : (
        <>
          <div
            className={classNames(
              'w-full',
              'flex flex-col justify-between sm:flex-row'
            )}
          >
            <SearchBox
              className="w-full sm:w-2/5"
              placeholder={t('giving.search-funds')}
              onChange={(e) => {
                searchRef.current = e.target.value
              }}
              onPressEnter={handleChangeSearch}
              allowClear
            />
            <Button
              className="flex: 1 mt-6 flex h-fit  items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
              icon={
                <div className="mr-1 flex">
                  <Image src={Plus} alt="plus-icon" width={15} height={15} />
                </div>
              }
              onClick={onCreate}
            >
              {t('giving.add-a-fund')}
            </Button>
          </div>
          <div
            className={classNames('w-full', 'mb-6 flex flex-row items-center')}
          >
            <Text className="pr-2 text-neutral-80">
              {t('giving.tithing-fund')}:
            </Text>
            <Select
              options={statusOptions}
              className="min-w-1/5 sm:w-1/5"
              value={filter.status || campusOptions[0]}
              onChange={(value) => {
                setFilter({ ...filter, status: value })
              }}
              suffixIcon={
                <Image
                  className="justify-end self-end text-neutral-70"
                  src={Downline}
                  alt="Downline"
                />
              }
            />
            <Text className="px-2 text-neutral-80">{t('giving.campus')}:</Text>
            <Select
              options={campusOptions}
              className="min-w-1/5 sm:w-1/5"
              value={filter.campusId || campusOptions[0]}
              onChange={(value) => {
                setFilter({ ...filter, campusId: value })
              }}
              suffixIcon={
                <Image
                  className="justify-end self-end text-neutral-70"
                  src={Downline}
                  alt="Downline"
                />
              }
            />
          </div>
        </>
      )}
      <FundList funds={funds} />
      <SuggestedGiftModal ref={suggestedGiftModalRef} />
      <ChooseCampusModal ref={chooseCampusModalRef} />
      <CreateTithingFundModal
        ref={createTithingFundModalRef}
        onChooseCampus={chooseCampusModalRef?.current?.show!}
        onChooseSuggestedGift={suggestedGiftModalRef?.current?.show!}
      />
    </div>
  )
}
