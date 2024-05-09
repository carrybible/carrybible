import Pencil from '@assets/icons/Pencil.svg'
import ButtonMore from '@components/ButtonMore'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { GroupPlanType } from '@shared/Firebase/group'
import { usePlanDateStatus } from '@shared/Utils'
import { Avatar, TableProps } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

type RecordType = {
  key: string
  plan: any
  length: number
  status: 'draft' | 'normal' | 'ended' | string
}

const GroupPlanTable: React.FC<{
  className?: string
  data: GroupPlanType[]
}> = ({ className, data }) => {
  const { t } = useTranslation()
  const getDateStatus = usePlanDateStatus()
  const isMobile = useAppSelector((state) => state.app.isMobile)
  const router = useRouter()
  const groupId = router.query['groupId'] as string
  const dataSource = data.map((plan: any) => ({
    key: plan.id,
    plan: {
      id: plan.originalId,
      name: plan.name,
      avatar: plan.featuredImage,
    },
    length: plan.duration,
    status: getDateStatus(
      new Date(plan.startDate),
      plan.duration,
      plan.status,
      new Date(plan.updated)
    ),
  }))
  const columns: TableProps<RecordType>['columns'] = [
    {
      key: 'plan',
      title: 'PLAN',
      dataIndex: 'plan',
      render: (value, record) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <Avatar src={record.plan.avatar} className="h-[50px] w-[50px]" />
            </div>
            <div>
              <LargerText strong>{record.plan.name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'length',
      title: 'LENGTH',
      dataIndex: 'length',
      responsive: ['sm'],
      render: (value) => {
        return (
          <LargerText className="text-neutral-80">
            {t('group.plan-length', { dayValue: value })}
          </LargerText>
        )
      },
    },
    {
      key: 'status',
      title: 'STATUS',
      dataIndex: 'status',
      responsive: ['sm'],
    },
    {
      key: 'actions',
      render: () => {
        return (
          <ButtonMore
            disabled
            data={[
              {
                key: 'edit',
                label: t('group.edit-plan'),
                icon: <Image src={Pencil} alt="edit icon" />,
              },
            ]}
          />
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
            router.push(`/groups/${groupId}/${row.plan.id}`)
          },
        })}
        rowKey={(record) => record.key}
        showHeader={!isMobile}
      />
    </div>
  )
}
export default GroupPlanTable
