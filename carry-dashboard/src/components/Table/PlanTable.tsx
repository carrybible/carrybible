import Pencil from '@assets/icons/Pencil.svg'
import Delete from '@assets/icons/Delete.svg'
import ButtonMore from '@components/ButtonMore'
import PlanCreationModal, {
  PlanCreationModalRef,
} from '@components/Modals/Plan/CreatePlanModal'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { Plan } from '@dts/Plans'
import { useAppSelector } from '@redux/hooks'
import { TableProps, Avatar } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useMemo, useRef } from 'react'
import DeletePlanModal, {
  DeletePlanModalRef,
} from '@components/Modals/Plan/DeletePlanModal'
import { PLAN_TYPE_TABLE, PlanTypeTable } from '@shared/Constants'

const PlanTable: React.FC<{
  className?: string
  data: Plan[]
  onTableUpdated: () => void
  planType?: PlanTypeTable
}> = ({ className, data, onTableUpdated, planType }) => {
  const { t } = useTranslation()
  const isMobile = useAppSelector((state) => state.app.isMobile)
  const planCreationModalRef = useRef<PlanCreationModalRef>(null)
  const deletePlanModalRef = useRef<DeletePlanModalRef>(null)

  const me = useAppSelector((state) => state.me)

  const onPressEditPlan = useCallback((plan: Plan) => {
    planCreationModalRef.current?.show(plan)
  }, [])

  const onPressDeletePlan = useCallback((plan: Plan) => {
    deletePlanModalRef.current?.show({
      organizationId: me.organisation.id,
      planId: plan.id,
      planAvatar: plan.featuredImage,
      planName: plan.name,
      markAsTemplate: plan.markAsTemplate,
      shareWithMobile: plan.shareWithMobile,
    })
  }, [])

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
      danger?: boolean
    }[] = []

    actions.push({
      key: 'edit',
      label: t('plans.edit-plan-details'),
      icon: <Image src={Pencil} alt="edit icon" />,
    })
    if (
      ['admin', 'owner', 'campus-user', 'campus-leader'].includes(
        me?.organisation?.role ?? ''
      )
    ) {
      actions.push({
        danger: true,
        key: 'delete-plan',
        label:
          !planType || planType === PLAN_TYPE_TABLE.ALL
            ? t('plan.delete-btn')
            : planType === PLAN_TYPE_TABLE.FEATURE
            ? t('plan.remove-from-featured')
            : t('plan.remove-from-templates'),
        icon: (
          <Image src={Delete} className="text-warning" alt="delete-plan-icon" />
        ),
      })
    }
    return actions
  }, [t, me?.organisation?.role])

  let columns: TableProps<Plan>['columns'] = [
    {
      key: 'name',
      title: 'PLAN NAME',
      dataIndex: 'planName',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value, record) => {
        return (
          <div className="flex items-center gap-4">
            <Avatar
              shape="square"
              className="rounded-2xl"
              src={record.featuredImage}
              alt="plan image"
              size={50}
            />
            <Link href={`/plans/${record.id}`}>
              <LargerText
                strong
                className="hover:cursor-pointer hover:text-primary"
              >
                {record.name}
              </LargerText>
            </Link>
          </div>
        )
      },
    },
    {
      key: 'length',
      title: 'LENGTH',
      dataIndex: 'duration',
      sorter: (a, b) => a.duration - b.duration,
      responsive: ['sm'],
      render(value, record) {
        const pace = record.pace || 'day'
        const unit = value > 1 ? `${pace}s` : pace
        return <LargerText>{value + ' ' + unit}</LargerText>
      },
    },
    {
      key: 'createdBy',
      title: 'CREATED BY',
      dataIndex: ['authorInfo', 'name'],
      sorter: (a, b) =>
        (a.authorInfo?.name || '').localeCompare(b.authorInfo?.name || ''),
      responsive: ['sm'],
      render(value) {
        return <LargerText>{value}</LargerText>
      },
    },
    {
      key: 'actions',
      render: (_, plan) => {
        return (
          <ButtonMore
            data={buttonMoreData}
            onClick={(e) => {
              if (e.key === 'edit') {
                onPressEditPlan(plan)
              }
              if (e.key === 'delete-plan') {
                onPressDeletePlan(plan)
              }
            }}
          />
        )
      },
    },
  ]

  if (
    (me?.campusAccess?.length || 0) < 2 &&
    me?.organisation?.role !== 'admin' &&
    me?.organisation?.role !== 'owner'
  ) {
    columns = columns.filter((i) => i.key !== 'campus.campusName')
  }
  return (
    <div className={classNames('flex flex-col', className)}>
      <Table<Plan>
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
        }}
        rowKey={(record) => record.id}
        showHeader={!isMobile}
      />
      <PlanCreationModal ref={planCreationModalRef} />
      <DeletePlanModal
        ref={deletePlanModalRef}
        onDeleted={onTableUpdated}
        planType={planType}
      />
    </div>
  )
}
export default PlanTable
