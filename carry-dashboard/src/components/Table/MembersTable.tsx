import Pencil from '@assets/icons/Pencil.svg'
import Delete from '@assets/icons/Delete.svg'
import Button from '@components/Button'
import ButtonMore from '@components/ButtonMore'
import { MembersEmpty } from '@components/EmptyStates'
import { usePermissionChecker } from '@components/PermissionsChecker'
import RoleChip from '@components/RoleChip'
import SearchBox from '@components/SearchBox'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import MemberAvatar from '@components/MemberAvatar'
import Plus from '@assets/icons/Plus.svg'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import Firebase from '@shared/Firebase'
import {
  exportMembers,
  getMembers,
  MemberDataType,
  MembersScopeType,
} from '@shared/Firebase/member'
import Permissions from '@shared/Permissions'
import { formatDateStringFromNow } from '@shared/Utils'
import { message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import classNames from 'classnames'

import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DeleteMemberModal, {
  DeleteMemberModalRef,
} from '@components/Modals/DeleteMemberModal'

const PAGE_SIZE = 10

const MemberButtonMore = ({
  userInfo,
  handleOnClick,
}: {
  userInfo: MemberDataType
  handleOnClick: (userInfo: MemberDataType) => void
}) => {
  const router = useRouter()
  const { t } = useTranslation()
  const permit = usePermissionChecker({
    permissionsRequire: [Permissions.EDIT_PROFILE],
    extraPermissions: userInfo.permissions,
  })

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
    }[] = []

    if (userInfo.uid === Firebase.auth.currentUser?.uid) {
      actions.push({
        key: 'edit',
        label: t('members.edit-profile'),
        icon: <Image src={Pencil} alt="edit-icon" />,
      })
    } else {
      // if (userInfo.permissions?.includes(Permissions.EDIT_PROFILE)) {
      //   actions.push({
      //     key: 'edit',
      //     label: t('members.edit-profile'),
      //     icon: <Image src={Pencil} alt="edit-icon" />,
      //   })
      // }
      if (userInfo.permissions?.includes(Permissions.REMOVE_MEMBER)) {
        actions.push({
          key: 'delete',
          label: t('members.delete-member'),
          icon: (
            <Image src={Delete} className="text-warning" alt="delete-icon" />
          ),
        })
      }
    }

    return actions
  }, [t, userInfo.permissions, userInfo.uid])

  if (!permit) {
    return null
  }

  return (
    <ButtonMore
      data={buttonMoreData}
      onClick={async (e) => {
        if (e.key === 'edit') {
          await router.push({
            pathname: `/members/${userInfo.uid}`,
            query: {
              edit: true,
            },
          })
        }
        if (e.key === 'delete') {
          handleOnClick(userInfo)
        }
      }}
    />
  )
}

export type MembersTableDataType = {
  pagination: TablePaginationConfig
  searchText: string
  dataSource: MemberDataType[] | null
}

const MembersTable: React.FC<{
  className?: string
  scope: MembersScopeType
  scopeId: string
  isSettings?: boolean
  initData?: Partial<MembersTableDataType>
  onSync?: (data: MembersTableDataType) => void
  onClickAddMember?: () => void
}> = ({
  className,
  scope,
  scopeId,
  initData,
  onSync,
  isSettings,
  onClickAddMember,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me)
  const router = useRouter()

  const isMobile = useAppSelector((state) => state.app.isMobile)

  const deleteMemberModalRef = useRef<DeleteMemberModalRef>(null)

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<
    MembersTableDataType['pagination']
  >(
    initData?.pagination ?? {
      current: 1,
      pageSize: PAGE_SIZE,
    }
  )
  const [searchText, setSearchText] = useState<
    MembersTableDataType['searchText']
  >(initData?.searchText ?? '')
  const [dataSource, setDataSource] = useState<
    MembersTableDataType['dataSource']
  >(initData?.dataSource ?? [])

  const onPressDeleteMember = useCallback((user: MemberDataType) => {
    deleteMemberModalRef.current?.show({
      userId: user.uid,
      userAvatar: user.image,
      userName: user.name,
    })
  }, [])

  const columns: TableProps<MemberDataType>['columns'] = [
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
            <div>
              <LargerText strong>{name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'joined',
      title: 'JOINED',
      dataIndex: 'joinDate',
      sorter: true,
      render: (joinDate: string) => {
        let date = formatDateStringFromNow(joinDate)
        return <LargerText>{date}</LargerText>
      },
      responsive: ['sm'],
    },
    {
      key: 'role',
      title: 'ROLE',
      sorter: true,
      render: (_, { organisation }) => {
        if (organisation)
          return (
            <div className="flex justify-center sm:justify-start">
              <RoleChip role={organisation?.role} />{' '}
            </div>
          )
        return ''
      },
      responsive: ['sm'],
    },
    {
      key: 'actions',
      render: (_, userInfo) => {
        return (
          <MemberButtonMore
            userInfo={userInfo}
            handleOnClick={() => onPressDeleteMember(userInfo)}
          />
        )
      },
    },
  ]

  const fetchData = useCallback(
    async ({
      pagination,
      orders,
      showLoading = true,
    }: {
      pagination: TablePaginationConfig
      orders?: { key: 'name' | 'role' | 'joined'; order: 'asc' | 'desc' }[]
      showLoading?: boolean
    }) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        const result = await getMembers({
          scope,
          scopeId,
          page: pagination.current ?? 1,
          limit: pagination.pageSize ?? PAGE_SIZE,
          search: searchText,
          orders: orders && orders.length > 0 ? orders : undefined,
        })

        if (!result.success) {
          message.error(t(result.message ?? 'members.cant-load-member-data'))
          return
        }

        if (
          result.data.length === 0 &&
          pagination.current === 1 &&
          searchText === ''
        ) {
          setDataSource(null)
        } else {
          const checkOrgMems = result.data.map((member) =>
            !member.organisation ||
            member.organisation.id !== me.organisation.id
              ? {
                  ...member,
                  organisation: {
                    role: t('members.not-in-org'),
                  },
                }
              : member
          )
          setDataSource(checkOrgMems)
        }
        setPagination({
          ...pagination,
          total: result?.total ?? result?.data?.length ?? 0,
        })
      } finally {
        setLoading(false)
      }
    },
    [scope, scopeId, searchText, t, me.organisation.id]
  )

  useEffect(() => {
    fetchData({ pagination, showLoading: !initData?.dataSource?.length })

    // For init load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      onSync?.({
        dataSource,
        pagination,
        searchText,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, pagination, searchText])

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
    sorter: SorterResult<MemberDataType> | SorterResult<MemberDataType>[]
  ) => {
    fetchData({
      pagination: newPagination,
      orders: (Array.isArray(sorter) ? sorter : [sorter])
        .filter((item) => !!item.column?.key)
        .map((item) => ({
          key: item.columnKey as 'name' | 'joined' | 'role',
          order: item.order === 'descend' ? 'desc' : 'asc',
        })),
    })
  }

  if (dataSource === null) {
    return <MembersEmpty />
  }

  return (
    <div className={classNames('flex flex-col', className)}>
      <div
        className={classNames(
          'mb-6 flex flex-col justify-between sm:flex-row',
          !isSettings && 'mb-4'
        )}
      >
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={
            isSettings ? t('settings.search-users') : t('search-members')
          }
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        {isSettings ? (
          <Button
            className="flex: 1 mt-6 flex h-fit  items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
            icon={
              <div className="mr-1 flex">
                <Image src={Plus} alt="plus-icon" width={15} height={15} />
              </div>
            }
            onClick={onClickAddMember}
          >
            {t('settings.add-a-user')}
          </Button>
        ) : null}
      </div>
      <Table<MemberDataType>
        columns={columns}
        exportable={!isSettings}
        onExportClick={async () => {
          dispatch(startLoading())
          const result = await exportMembers({
            scope,
            scopeId,
          })
          dispatch(stopLoading())

          if (!result.success) {
            message.error(t(result.message ?? 'members.failed-export-members'))
            throw new Error('members.failed-export-members')
          }
          return result.data.urlDownload
        }}
        dataSource={dataSource}
        pagination={pagination}
        rowKey={(record) => record.uid}
        rowClassName="hover:cursor-pointer"
        onRow={(data) => ({
          onClick: async () => {
            if (!isSettings) {
              await router.push(`/members/${data.uid}`)
            } else {
              await router.push(`/settings/${data.uid}`)
            }
          },
        })}
        onChange={handleTableChange}
        scroll={{ x: isMobile ? 0 : 500 }}
      />
      <DeleteMemberModal
        ref={deleteMemberModalRef}
        onDeleted={() =>
          fetchData({ pagination, showLoading: !initData?.dataSource?.length })
        }
      />
    </div>
  )
}
export default MembersTable
