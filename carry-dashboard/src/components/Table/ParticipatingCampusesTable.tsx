import { Avatar, TableProps } from 'antd'
import classNames from 'classnames'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { ParticipatingCampuses } from '@shared/Firebase/giving'
import { toCurrency } from '@shared/Utils'
import { exportDonation } from '@shared/Firebase/donation'
import { startLoading, stopLoading } from '@redux/slices/app'

const ParticipatingCampusesTable: React.FC<{
  className?: string
  data: ParticipatingCampuses[]
  fundId: string
}> = ({ className, data, fundId }) => {
  const isMobile = useAppSelector((state) => state.app.isMobile)
  const giving = useAppSelector((state) => state.giving)
  const dataSource = data.map((item: any) => ({
    key: item.id,
    ...item,
  }))
  const dispatch = useAppDispatch()

  const getSymbol = (currency: string) =>
    giving.settingCurrencies?.[currency]?.symbol

  const exportData = async () => {
    dispatch(startLoading())
    try {
      const urlLink = (await exportDonation({ fundId: fundId }))?.data
        ?.urlDownload
      dispatch(stopLoading())
      return urlLink
    } catch (error) {
      dispatch(stopLoading())
    }
    return ''
  }
  const columns: TableProps<ParticipatingCampuses>['columns'] = [
    {
      key: 'name',
      title: 'NAME',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string, campus) => {
        return (
          <div className="flex items-center space-x-6">
            <div>
              <Avatar src={campus.image || ''} size={50} />
            </div>
            <div className="max-w-[240px]">
              <LargerText strong>{value}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'totalGroups',
      title: '# OF GROUPS',
      dataIndex: 'totalGroups',
      sorter: (a, b) => a.totalGroups - b.totalGroups,
      responsive: ['sm'],
    },
    {
      key: 'amount',
      title: 'FUNDS RAISED',
      dataIndex: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      responsive: ['sm'],
      render: (value, record) => {
        return (
          <LargerText className="text-neutral-80">
            {`${getSymbol(record.currency)} ${toCurrency(record.amount)}`}
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
        pagination={{ pageSize: 10 }}
        rowKey={(record) => record.id}
        rowClassName="hover:cursor-pointer"
        scroll={{ x: isMobile ? 0 : 500 }}
        exportable={true}
        onExportClick={() => exportData()}
      />
    </div>
  )
}
export default ParticipatingCampusesTable
