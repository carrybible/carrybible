import SearchBox from '@components/SearchBox'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import MemberAvatar from '@components/MemberAvatar'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { toCurrency } from '@shared/Utils'
import { message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import classNames from 'classnames'
import { Text } from '@components/Typography'
import Downline from '@assets/icons/Downline.svg'
import Image from 'next/image'
import Select from '@components/Select'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useEffect, useState } from 'react'
import { DonationDataType, getDonations } from '@shared/Firebase/donation'
import currencies from '@shared/Currencies'
import { GivingResponse } from '@shared/Firebase/giving'
import moment from 'moment'
import { useRouter } from 'next/router'

const PAGE_SIZE = 10

export type DonationsTableDataType = {
  pagination: TablePaginationConfig
  searchText: string
  campusId?: string
  campaignId?: string
  fundId?: string
  dataSource: DonationDataType[] | null | undefined
}

const DonationTable: React.FC<{
  className?: string
  fundId?: string
  campaignId?: string
  campusId?: string
  givingId: string
  initData?: Partial<DonationsTableDataType>
  reload: boolean
  campusOption: {
    key: string
    label: string
    value: string
  }[]
  givingOption: {
    key: string
    label: string
    value: string
  }[]
  filterGiving: GivingResponse[]
  setReload: (data: boolean) => void
  setFilteringCampus: (data: string) => void
  setFilterGiving: (data: string) => void
  setFilteringCampaign: (data: string) => void
  setFilteringFund: (data: string) => void
}> = ({
  className,
  fundId,
  campaignId,
  campusId,
  givingId,
  initData,
  reload,
  campusOption,
  givingOption,
  filterGiving,
  setReload,
  setFilteringCampus,
  setFilterGiving,
  setFilteringCampaign,
  setFilteringFund,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const router = useRouter()

  const isMobile = useAppSelector((state) => state.app.isMobile)

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<
    DonationsTableDataType['pagination']
  >(
    initData?.pagination ?? {
      current: 1,
      pageSize: PAGE_SIZE,
    }
  )
  const [searchText, setSearchText] = useState<
    DonationsTableDataType['searchText']
  >(initData?.searchText ?? '')
  const [dataSource, setDataSource] = useState<
    DonationsTableDataType['dataSource']
  >(initData?.dataSource ?? [])

  const columns: TableProps<DonationDataType>['columns'] = [
    {
      key: 'name',
      title: 'NAME',
      sorter: true,
      render: (_, { name, image }) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <MemberAvatar src={image} size={50} />
            </div>
            <div className="max-w-[240px]">
              <LargerText strong>{name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'amount',
      title: 'GIFT AMOUNT',
      dataIndex: 'amount',
      sorter: true,
      render: (_, { amount, currency }) => {
        const currencySymbol =
          currencies.find((x) => x.key === currency.toUpperCase())?.symbol ?? ''
        return (
          <LargerText>{`${currencySymbol} ${toCurrency(amount)}`}</LargerText>
        )
      },
      responsive: ['sm'],
    },
    {
      key: 'date',
      title: 'DATE',
      dataIndex: 'paidAt',
      sorter: true,
      render: (paidAt: string) => {
        return (
          <LargerText className="text-neutral-80">
            {moment(paidAt).format('MMMM Do, YYYY')}
          </LargerText>
        )
      },
      responsive: ['sm'],
    },
  ]

  const fetchData = useCallback(
    async ({
      pagination,
      orders,
      showLoading = true,
    }: {
      pagination: TablePaginationConfig
      orders?: { key: 'name' | 'amount' | 'date'; order: 'asc' | 'desc' }[]
      showLoading?: boolean
    }) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        const result = await getDonations({
          search: searchText,
          page: pagination.current ?? 1,
          limit: pagination.pageSize ?? PAGE_SIZE,
          campaignId,
          fundId,
          campusId,
          orders: orders && orders.length > 0 ? orders[0] : undefined,
        })

        if (!result.success) {
          message.error(t(result.message ?? 'giving.cant-load-donation-data'))
          return
        }

        if (
          result.data.length === 0 &&
          pagination.current === 1 &&
          searchText === ''
        ) {
          setDataSource(null)
        } else {
          setDataSource(result.data)
        }
        setPagination({
          ...pagination,
          total: result.total,
        })
      } finally {
        setLoading(false)
      }
    },
    [campusId, fundId, campaignId, searchText, t]
  )

  useEffect(() => {
    fetchData({
      pagination,
      showLoading: !initData?.dataSource?.length,
    })
  }, [])

  useEffect(() => {
    if (reload) {
      fetchData({ pagination, showLoading: !initData?.dataSource?.length })
      setReload(false)
    }
  }, [reload])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  const handleSearch = useCallback(() => {
    fetchData({ pagination })
  }, [fetchData, pagination])

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: any,
    sorter: SorterResult<DonationDataType> | SorterResult<DonationDataType>[]
  ) => {
    fetchData({
      pagination: newPagination,
      orders: (Array.isArray(sorter) ? sorter : [sorter])
        .filter((item) => !!item.column?.key)
        .map((item) => ({
          key: item.columnKey as 'name' | 'amount' | 'date',
          order: item.order === 'descend' ? 'desc' : 'asc',
        })),
    })
  }

  return (
    <div className={classNames('pb-15 flex flex-col', className)}>
      <div
        className={classNames('mb-8 flex flex-col justify-between sm:flex-row')}
      >
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={t('giving.search-donations')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </div>
      <div className={classNames('w-full', 'mb-6 flex flex-row items-center')}>
        <Text className="pr-2 text-neutral-80">
          {t('giving.title-campaign-fund')}
        </Text>
        <Select
          options={givingOption}
          placeholder={t('giving.title-campaign-fund')}
          className="min-w-1/5 sm:w-1/5"
          value={givingId}
          onChange={(value) => {
            setFilterGiving(value)
            setFilteringCampaign(
              filterGiving?.find((x) => x.id === value && x.type === 'campaign')
                ?.id ?? ''
            )
            setFilteringFund(
              filterGiving?.find((x) => x.id === value && x.type === 'fund')
                ?.id ?? ''
            )
            setReload(true)
          }}
          suffixIcon={
            <Image
              className="justify-end self-end text-neutral-70"
              src={Downline}
              alt="Downline"
            />
          }
        />
        <Text className="p-l-2 pr-2 pl-2 text-neutral-80">
          {t('giving.title-campus')}
        </Text>
        <Select
          options={campusOption}
          placeholder={t('giving.title-campus')}
          className="min-w-1/5 sm:w-1/5"
          value={campusId}
          onChange={(value) => {
            setFilteringCampus(value)
            setReload(true)
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
      <Table<DonationDataType>
        columns={columns}
        dataSource={dataSource ?? []}
        pagination={pagination}
        rowKey={(record) => record.id}
        rowClassName="hover:cursor-pointer"
        onChange={handleTableChange}
        scroll={{ x: isMobile ? 0 : 500 }}
        onRow={(row) => ({
          onClick: () => {
            router.push(`/members/${row.id}`)
          },
        })}
      />
    </div>
  )
}
export default DonationTable
