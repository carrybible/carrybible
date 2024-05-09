import Eye from '@assets/icons/Eye.svg'
import Pencil from '@assets/icons/Pencil.svg'
import Delete from '@assets/icons/Delete.svg'
import Button from '@components/Button'
import ButtonMore from '@components/ButtonMore'
import { MembersEmpty } from '@components/EmptyStates'
// import { usePermissionChecker } from '@components/PermissionsChecker'
import RoleChip from '@components/RoleChip'
import SearchBox from '@components/SearchBox'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import Plus from '@assets/icons/Plus.svg'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import Permissions from '@shared/Permissions'
import {
  getDashboardUsers,
  MemberDataType,
  MembersScopeType,
} from '@shared/Firebase/member'
// import Permissions from '@shared/Permissions'
import { Avatar, message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import classNames from 'classnames'

import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { User } from '@dts/User'

const PAGE_SIZE = 10

const MemberButtonMore = ({
  userInfo,
  handleDeleteAccess,
  handleChangeRole,
}: {
  userInfo: MemberDataType
  handleDeleteAccess?: (userInfo: MemberDataType) => void
  handleChangeRole?: () => void
}) => {
  const router = useRouter()
  const me = useAppSelector((state) => state.me) as User
  const { t } = useTranslation()
  //   const permit = usePermissionChecker({
  //     permissionsRequire: [Permissions.EDIT_PROFILE],
  //     extraPermissions: userInfo.permissions,
  //   })

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
    }[] = []
    actions.push({
      key: 'view',
      label: t('members.view-profile'),
      icon: <Image src={Eye} alt="view-icon" />,
    })
    if (
      userInfo.uid !== me?.uid &&
      userInfo.permissions?.includes(Permissions.EDIT_PROFILE)
    ) {
      if (
        !(
          userInfo.organisation?.role === 'admin' &&
          me.organisation.role !== 'owner'
        )
      ) {
        actions.push({
          key: 'changerole',
          label: t('members.assign-role'),
          icon: <Image src={Pencil} alt="edit-icon" />,
        })
      }
    }

    if (
      userInfo.uid !== me?.uid &&
      userInfo.permissions?.includes(Permissions.REMOVE_MEMBER)
    ) {
      if (
        !(
          userInfo.organisation?.role === 'admin' &&
          me.organisation.role !== 'owner'
        )
      ) {
        actions.push({
          key: 'remove',
          label: t('members.remove-acess-member'),
          icon: (
            <Image src={Delete} className="text-warning" alt="delete-icon" />
          ),
        })
      }
    }
    return actions
  }, [t, userInfo.permissions])

  return (
    <ButtonMore
      data={buttonMoreData}
      onClick={async (e) => {
        if (e.key === 'view') {
          await router.push({
            pathname: `/settings/${userInfo.uid}`,
            query: {
              detail: true,
            },
          })
        }
        if (e.key === 'remove') {
          handleDeleteAccess?.(userInfo)
        }
        if (e.key === 'changerole') {
          handleChangeRole?.()
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

const DashboardUsersTable: React.FC<{
  className?: string
  scope: MembersScopeType
  scopeId: string
  isSettings?: boolean
  initData?: Partial<MembersTableDataType>
  onSync?: (data: MembersTableDataType) => void
  onClickAddMember?: () => void
  reload?: boolean
  onPressDeleteMember?: (userInfo: MemberDataType) => void
  onChangeRole?: (userInfo: MemberDataType) => void
  setReload: (data: boolean) => void
}> = ({
  className,
  initData,
  onSync,
  isSettings,
  onClickAddMember,
  reload,
  onPressDeleteMember,
  onChangeRole,
  setReload,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const router = useRouter()
  const isMobile = useAppSelector((state) => state.app.isMobile)

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

  const DashboardAccess = ({ data }: { data: string }) => {
    const { t } = useTranslation()

    return <LargerText>{data || t('settings.no-campuses')}</LargerText>
  }

  const columns: TableProps<MemberDataType>['columns'] = [
    {
      key: 'name',
      title: 'NAME',
      sorter: true,
      render: (_, { name, image }) => {
        return (
          <div className="flex items-center gap-4">
            <div>
              <Avatar src={image} className="h-[50px] w-[50px]" />
            </div>
            <div>
              <LargerText strong>{name}</LargerText>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      title: 'ROLE',
      sorter: true,
      render: (_, { organisation }) => {
        return <RoleChip role={organisation?.role} hasBackground={false} />
      },
      responsive: ['sm'],
    },
    {
      key: 'dashboardAccess',
      title: 'DASHBOARD ACCESS',
      dataIndex: 'dashboardAccess',
      sorter: true,
      render: (dashboardAccess: string) => (
        <DashboardAccess data={dashboardAccess} />
      ),
      responsive: ['sm'],
    },
    {
      key: 'actions',
      render: (_, userInfo) => {
        return (
          <MemberButtonMore
            userInfo={userInfo}
            handleDeleteAccess={() => onPressDeleteMember?.(userInfo)}
            handleChangeRole={() => onChangeRole?.(userInfo)}
          />
        )
      },
    },
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = async ({
    pagination,
    orders,
    showLoading = true,
  }: {
    pagination: TablePaginationConfig
    orders?: {
      key: 'name' | 'role' | 'dashboardAccess'
      order: 'asc' | 'desc'
    }[]
    showLoading?: boolean
  }) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const result = await getDashboardUsers({
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
        setDataSource(result.data)
      }
      setPagination({
        ...pagination,
        total: result.total,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (reload) {
      fetchData({ pagination, showLoading: !initData?.dataSource?.length })
      setReload(false)
    }
  }, [reload])

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
          key: item.columnKey as 'name' | 'dashboardAccess' | 'role',
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
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />

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
      </div>
      <Table<MemberDataType>
        columns={columns}
        exportable={false}
        dataSource={dataSource}
        pagination={pagination}
        rowKey={(record) => record.uid}
        rowClassName="hover:cursor-pointer"
        onRow={(data) => ({
          onClick: async () => {
            await router.push(`/settings/${data.uid}`)
          },
        })}
        onChange={handleTableChange}
        scroll={{ x: isMobile ? 0 : 500 }}
      />
    </div>
  )
}
export default DashboardUsersTable
