import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { DonationOfUser } from '@shared/Firebase/giving'
import { toCurrency } from '@shared/Utils'
import { Avatar, TableProps } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import { useRouter } from 'next/router'
import React from 'react'

type RecordType = {
  key: string
  user: any
  gift: any
  date: any
}

const TithingFundDonationsTable: React.FC<{
  className?: string
  data: DonationOfUser[]
}> = ({ className, data }) => {
  const router = useRouter()
  const giving = useAppSelector((state) => state.giving)

  const dataSource = data.map((donation: any) => ({
    key: donation.id,
    user: {
      image: donation.image,
      name: donation.name,
    },
    gift: {
      currency: donation.currency,
      amount: donation.amount,
    },
    date: donation.paidAt,
  }))

  const getSymbol = (currency: string) =>
    giving.settingCurrencies?.[currency]?.symbol

  const columns: TableProps<RecordType>['columns'] = [
    {
      key: 'name',
      title: 'NAME',
      dataIndex: 'name',
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      render: (value, record) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <Avatar src={record.user.image} className="h-[50px] w-[50px]" />
            </div>
            <div className="max-w-[240px]">
              <LargerText strong>{record.user.name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'amount',
      title: 'GIFT AMOUNT',
      dataIndex: 'amount',
      responsive: ['sm'],
      sorter: (a, b) => a.gift.amount - b.gift.amount,
      render: (value, record) => {
        return (
          <LargerText className="text-neutral-80">
            {`${getSymbol(record.gift.currency)} ${toCurrency(
              record.gift.amount || 0
            )} `}
          </LargerText>
        )
      },
    },
    {
      key: 'date',
      title: 'DATE',
      dataIndex: 'date',
      responsive: ['sm'],
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (value, record) => {
        return (
          <LargerText className="text-neutral-80">
            {moment(record.date).format('MMMM Do, YYYY')}
          </LargerText>
        )
      },
    },
  ]

  return (
    <div className={classNames('flex flex-col', className)}>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{
          pageSize: 5,
        }}
        rowClassName="hover:cursor-pointer"
        onRow={(row) => ({
          onClick: () => {
            router.push(`/members/${row.key}`)
          },
        })}
        rowKey={(record) => record.key}
      />
    </div>
  )
}
export default TithingFundDonationsTable
