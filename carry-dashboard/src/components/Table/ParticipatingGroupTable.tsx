import { Avatar } from 'antd'
import classNames from 'classnames'

import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { ParticipatingGroup } from '@redux/slices/group'
import { toCurrency } from '@shared/Utils'
import { useRouter } from 'next/router'
import { startLoading, stopLoading } from '@redux/slices/app'
import { exportDonation } from '@shared/Firebase/donation'

const ParticipatingGroupTable: React.FC<{
  className?: string
  dataSource: ParticipatingGroup[]
  campaignId: string
}> = ({ className, dataSource, campaignId }) => {
  const isMobile = useAppSelector((state) => state.app.isMobile)
  const giving = useAppSelector((state) => state.giving)
  const router = useRouter()
  const dispatch = useAppDispatch()

  const getSymbol = (currency: string) =>
    giving.settingCurrencies?.[currency]?.symbol

  const exportData = async () => {
    dispatch(startLoading())
    try {
      const urlLink = (await exportDonation({ campaignId: campaignId }))?.data
        ?.urlDownload
      dispatch(stopLoading())
      return urlLink
    } catch (error) {
      dispatch(stopLoading())
    }
    return ''
  }

  return (
    <div className={classNames('flex flex-col', className)}>
      <Table<ParticipatingGroup>
        columns={[
          {
            key: 'name',
            dataIndex: 'name',
            title: 'GROUP NAME',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (value: string, group) => {
              return (
                <div className="flex items-center space-x-6">
                  <div>
                    <Avatar src={group.image || ''} size={50} />
                  </div>
                  <div className="max-w-[240px]">
                    <LargerText strong>{value}</LargerText>
                  </div>
                </div>
              )
            },
          },
          {
            key: 'leader',
            title: 'GROUP LEADER',
            dataIndex: ['leader', 'name'],
            sorter: (a, b) => a.leader.name.localeCompare(b.leader.name),
            responsive: ['sm'],
            render: (value) => <LargerText>{value}</LargerText>,
          },
          {
            key: 'funds_raised',
            title: 'FUNDS RAISED',
            dataIndex: 'amount',
            sorter: (a, b) => a.amount - b.amount,
            responsive: ['sm'],
            render: (value: number, record) => (
              <LargerText className="text-neutral-80">
                {`${getSymbol(record.currency)}${toCurrency(value)} `}
              </LargerText>
            ),
          },
        ]}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }}
        rowKey={(group) => group.id}
        rowClassName="hover:cursor-pointer"
        onRow={(row) => ({
          onClick: () => {
            router.push(`/groups/${row.id}`)
          },
        })}
        scroll={{ x: isMobile ? 0 : 500 }}
        exportable={true}
        onExportClick={() => exportData()}
      />
    </div>
  )
}
export default ParticipatingGroupTable
