import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import MemberAvatar from '@components/MemberAvatar'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useEffect, useState } from 'react'
import {
  getDonationOfUser,
  GivingHistoryDataType,
} from '@shared/Firebase/donation'
import currencies from '@shared/Currencies'
import moment from 'moment'
import { toCurrency } from '@shared/Utils'

const PAGE_SIZE = 999

export type MemberGivingTableDataType = {
  pagination: TablePaginationConfig
  dataSource: GivingHistoryDataType[] | null | undefined
}

const MemberGivingTable: React.FC<{
  className?: string
  userId: string
  initData?: Partial<MemberGivingTableDataType>
}> = ({ userId, initData }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const isMobile = useAppSelector((state) => state.app.isMobile)

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<
    MemberGivingTableDataType['pagination']
  >(
    initData?.pagination ?? {
      current: 1,
      pageSize: PAGE_SIZE,
    }
  )
  const [dataSource, setDataSource] = useState<
    MemberGivingTableDataType['dataSource']
  >(initData?.dataSource ?? [])

  const columns: TableProps<GivingHistoryDataType>['columns'] = [
    {
      key: 'name',
      title: 'CAMPAIGN/FUND',
      sorter: true,
      width: 400,
      render: (_, { name, image }) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <MemberAvatar src={image} size={50} />
            </div>
            <div>
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
      dataIndex: 'lastPaidAt',
      sorter: true,
      render: (lastPaidAt: string) => {
        let date = moment(lastPaidAt).format('MMMM Do, YYYY')
        return <LargerText>{date}</LargerText>
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
        const result = await getDonationOfUser({
          userId,
          orders: orders && orders.length > 0 ? orders[0] : undefined,
        })

        if (!result.success) {
          message.error(t(result.message ?? 'giving.cant-load-donation-data'))
          return
        }

        if (result.data.length === 0 && pagination.current === 1) {
          setDataSource(null)
        } else {
          setDataSource(result.data)
        }
        setPagination({
          ...pagination,
          total: result?.data.length,
        })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchData({
      pagination,
      showLoading: !initData?.dataSource?.length,
    })
  }, [])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: any,
    sorter:
      | SorterResult<GivingHistoryDataType>
      | SorterResult<GivingHistoryDataType>[]
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
    <Table<GivingHistoryDataType>
      className="pt-5"
      columns={columns}
      dataSource={dataSource ?? []}
      pagination={pagination}
      rowKey={(record) => record.id}
      rowClassName="hover:cursor-pointer"
      onChange={handleTableChange}
      scroll={{ x: isMobile ? 0 : 500 }}
    />
  )
}
export default MemberGivingTable
