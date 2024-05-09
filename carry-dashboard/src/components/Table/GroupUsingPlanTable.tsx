import Table from '@components/Table/index'
import { H4, LargerText } from '@components/Typography'
import { Plan } from '@dts/Plans'
import { useAppSelector } from '@redux/hooks'
import Firebase from '@shared/Firebase'
import { getPlanDetail } from '@shared/Firebase/group'
import { usePlanDateStatus } from '@shared/Utils'
import { Avatar, TableProps } from 'antd'
import classNames from 'classnames'
import { collection, CollectionReference, Timestamp } from 'firebase/firestore'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { useCollectionData } from 'react-firebase-hooks/firestore'

type RecordType = {
  key: string
  plan: {
    name: string
    avatar?: string
  }
  status: string
}

type PublishedGroup = {
  planInstanceId: string
  name: string
  startDate: Timestamp
  image: string
  groupId: string
  duration: number
  pace: string
}

export const generateStatusString = (
  getDateStatus: any,
  publishedGroup: PublishedGroup,
  plans: Plan[]
): string => {
  if (plans?.length) {
    const currentPlan = plans.find(
      (i) => i?.id === publishedGroup.planInstanceId
    )
    if (currentPlan?.startDate) {
      return getDateStatus(
        currentPlan?.startDate?.toDate(),
        currentPlan?.duration,
        currentPlan?.status,
        currentPlan?.updated.toDate()
      )
    }
  }

  return ''
}

const GroupUsingPlanTable: React.FC<{
  className?: string
  planId: string
}> = ({ className, planId }) => {
  const { t } = useTranslation()
  const isMobile = useAppSelector((state) => state.app.isMobile)
  const organisation = useAppSelector((state) => state.me.organisation)
  const [plans, setPlans] = useState<Plan[]>()
  const getDateStatus = usePlanDateStatus()
  const [publishedGroups] = useCollectionData(
    collection(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      organisation.id,
      Firebase.collections.ORG_PLANS,
      planId,
      Firebase.collections.PUBLISHED_GROUPS
    ) as CollectionReference<PublishedGroup>
  )

  useEffect(() => {
    const run = async () => {
      if (publishedGroups?.length) {
        const plans = await Promise.all(
          publishedGroups.map(async (g) => {
            return await getPlanDetail(g.groupId, g.planInstanceId)
          })
        )
        setPlans(plans)
      }
    }
    run()
  }, [publishedGroups])

  const dataSource =
    plans?.length &&
    publishedGroups?.map((publishGroup) => ({
      key: publishGroup.planInstanceId,
      plan: {
        name: publishGroup.name,
        avatar: publishGroup.image,
      },
      status: generateStatusString(getDateStatus, publishGroup, plans),
    }))

  const columns: TableProps<RecordType>['columns'] = [
    {
      key: 'plan',
      title: 'GROUP',
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
      key: 'status',
      title: 'STATUS',
      dataIndex: 'status',
      responsive: ['sm'],
    },
    // {
    //   key: 'actions',
    //   render: () => {
    //     return (
    //       <ButtonMore
    //         disabled
    //         data={[
    //           {
    //             key: 'edit',
    //             label: t('group.edit-plan'),
    //             icon: <Image src={Pencil} alt="edit icon" />,
    //           },
    //         ]}
    //       />
    //     )
    //   },
    // },
  ]

  return (
    <div className={classNames('mt-10 mb-6', className)}>
      <H4>{t('plan.group-using-this-plan')}</H4>
      <div className={classNames('flex flex-col')}>
        <Table
          columns={columns}
          dataSource={dataSource || []}
          pagination={{
            pageSize: 5,
          }}
          rowKey={(record) => record.key}
          showHeader={!isMobile}
        />
      </div>
    </div>
  )
}
export default GroupUsingPlanTable
