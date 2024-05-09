import Delete from '@assets/icons/Delete.svg'
import Pencil from '@assets/icons/Pencil.svg'
import ButtonMore from '@components/ButtonMore'
import DeleteGroupModal, {
  DeleteGroupModalRef,
} from '@components/Modals/DeleteGroupModal'
import GroupInfoModal, {
  GroupCreationModalRef,
} from '@components/Modals/GroupCreationModal'
import Table from '@components/Table/index'
import { H4, LargerText } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { Group } from '@redux/slices/group'
import { Avatar, TableProps } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useRef } from 'react'

const GroupTable: React.FC<{
  title?: string
  className?: string
  dataSource: Group[]
  filterCampusId?: string
  unEdit?: boolean
  onTableUpdated: () => void
}> = ({
  title,
  className,
  dataSource,
  filterCampusId,
  onTableUpdated,
  unEdit,
}) => {
  const { t } = useTranslation()
  const router = useRouter()

  const isMobile = useAppSelector((state) => state.app.isMobile)
  const groupCreationModalRef = useRef<GroupCreationModalRef>(null)
  const deleteGroupModalRef = useRef<DeleteGroupModalRef>(null)

  const onPressEditGroup = useCallback((group: Group) => {
    groupCreationModalRef.current?.show(group)
  }, [])
  const onPressDeleteGroup = useCallback((group: Group) => {
    deleteGroupModalRef.current?.show({
      groupId: group.id,
      groupAvatar: group.image,
      groupName: group.name,
    })
  }, [])

  const columns: TableProps<Group>['columns'] = [
    {
      key: 'name',
      title: 'GROUP NAME',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value, group) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <Avatar src={group.image} size={50} />
            </div>
            <div>
              <LargerText strong>{group.name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'leader',
      title: 'GROUP LEADER',
      dataIndex: ['leader', 'name'],
      sorter: (a, b) => a.leader?.name?.localeCompare(b.leader?.name),
      responsive: ['sm'],
    },
    {
      key: 'members',
      title: 'MEMBERS',
      dataIndex: 'memberCount',
      sorter: (a, b) => a.memberCount - b.memberCount,
      responsive: ['sm'],
    },
    {
      key: 'actions',
      render: (value: Group) => {
        return unEdit ? null : (
          <ButtonMore
            data={[
              {
                key: 'edit',
                label: t('group.edit-group-detail'),
                icon: <Image src={Pencil} alt="edit icon" />,
              },
              {
                label: t('group.delete-group'),
                key: 'delete',
                danger: true,
                icon: (
                  <Image
                    src={Delete}
                    className="text-warning"
                    alt="delete-icon"
                  />
                ),
              },
            ]}
            onClick={(e: any) => {
              if (e.key === 'edit') {
                onPressEditGroup(value)
              } else if (e.key === 'delete') {
                onPressDeleteGroup(value)
              }
            }}
          />
        )
      },
    },
  ]

  const filterDataSource = (data: Group[]) => {
    if (filterCampusId === '') return data
    if (filterCampusId === '-1') {
      return data.filter((x) => !x.campus?.id)
    } else {
      return data.filter((x) => x.campus?.id === filterCampusId)
    }
  }

  return (
    <div className={classNames('flex flex-col', className)}>
      {title && <H4 className="mb-6">{title}</H4>}
      <Table<Group>
        columns={columns}
        dataSource={filterDataSource(dataSource)}
        pagination={{
          pageSize: 10,
        }}
        rowKey={(group) => group.id}
        showHeader={!isMobile}
        rowClassName="hover:cursor-pointer"
        onRow={(group) => ({
          onClick: () => {
            router.push(`/groups/${group.id}`)
          },
        })}
        scroll={{ x: isMobile ? 0 : 500 }}
      />
      <GroupInfoModal ref={groupCreationModalRef} onUpdate={onTableUpdated} />
      <DeleteGroupModal ref={deleteGroupModalRef} onDeleted={onTableUpdated} />
    </div>
  )
}
export default GroupTable
