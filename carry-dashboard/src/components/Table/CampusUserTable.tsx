import Pencil from '@assets/icons/Pencil.svg'
import Button from '@components/Button'
import ButtonMore from '@components/ButtonMore'
import SearchBox from '@components/SearchBox'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import Plus from '@assets/icons/Plus.svg'
import { useAppDispatch } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import classNames from 'classnames'

import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CampusAccess, getCampusAccesses } from '@shared/Firebase/campus'
import AddUserToCampusModal, {
  AddUserToCampusModalRef,
} from '@components/Modals/AddUserToCampusModal'
import { MemberProfileType } from '@shared/Firebase/member'

const PAGE_SIZE = 10

export type CampusTableDataType = {
  pagination: TablePaginationConfig
  searchText: string
  dataSource: CampusAccess[] | null
}

const CampusUserTable: React.FC<{
  className?: string
  userInfo: MemberProfileType
  initData?: Partial<CampusTableDataType>
  onSync?: (data: CampusTableDataType) => void
}> = ({ className, initData, onSync, userInfo }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const addUserToCampusModalRef = useRef<AddUserToCampusModalRef>(null)
  const onClickAddACampus = (campusAccessInfo?: CampusAccess) =>
    addUserToCampusModalRef.current?.show(campusAccessInfo)

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<
    CampusTableDataType['pagination']
  >(
    initData?.pagination ?? {
      current: 1,
      pageSize: PAGE_SIZE,
    }
  )
  const [searchText, setSearchText] = useState<
    CampusTableDataType['searchText']
  >(initData?.searchText ?? '')
  const [dataSource, setDataSource] = useState<
    CampusTableDataType['dataSource']
  >(initData?.dataSource ?? [])

  const CampusButtonMore = ({
    campusAccessInfo,
  }: {
    campusAccessInfo: CampusAccess
  }) => {
    const { t } = useTranslation()

    const buttonMoreData = useMemo(() => {
      const actions: {
        key: string
        label: string
        icon: React.ReactNode
      }[] = []

      actions.push({
        key: 'edit',
        label: t('campuses.edit-campus'),
        icon: <Image src={Pencil} alt="edit-icon" />,
      })

      return actions
    }, [t])

    return (
      <ButtonMore
        data={buttonMoreData}
        onClick={async (e) => {
          if (e.key === 'edit') {
            onClickAddACampus?.(campusAccessInfo)
          }
        }}
      />
    )
  }

  const columns: TableProps<CampusAccess>['columns'] = [
    {
      key: 'name',
      title: 'CAMPUS',
      sorter: true,
      render: (_, { name }) => {
        return (
          <div className="flex items-center gap-4">
            <LargerText strong>{name}</LargerText>
          </div>
        )
      },
    },
    {
      key: 'location',
      title: 'LOCATION',
      sorter: true,
      render: (_, { location }) => {
        return <LargerText strong>{location}</LargerText>
      },
    },
    {
      key: 'createBy',
      title: 'ADDED BY',

      sorter: true,
      render: (_, { createBy }) => {
        return <LargerText>{createBy}</LargerText>
      },
    },
    {
      key: 'actions',
      render: (_, campus) => {
        return <CampusButtonMore campusAccessInfo={campus} />
      },
    },
  ]

  const fetchData = async ({
    pagination,
    orders,
    showLoading = true,
  }: {
    pagination: TablePaginationConfig
    orders?: {
      key: 'campus' | 'location' | 'addBy'
      order: 'asc' | 'desc'
    }[]
    showLoading?: boolean
  }) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const result = await getCampusAccesses({
        userId: userInfo.uid,
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
    sorter: SorterResult<CampusAccess> | SorterResult<CampusAccess>[]
  ) => {
    fetchData({
      pagination: newPagination,
      orders: (Array.isArray(sorter) ? sorter : [sorter])
        .filter((item) => !!item.column?.key)
        .map((item) => ({
          key: item.columnKey as 'campus' | 'location' | 'addBy',
          order: item.order === 'descend' ? 'desc' : 'asc',
        })),
    })
  }

  return (
    <div className={classNames('flex flex-col', className)}>
      <div
        className={classNames('mb-6 flex flex-col justify-between sm:flex-row')}
      >
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={t('campuses.search-users')}
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
          onClick={() => onClickAddACampus?.()}
        >
          {t('campuses.add-a-campus')}
        </Button>
      </div>
      <Table<CampusAccess>
        columns={columns}
        exportable={false}
        dataSource={dataSource || []}
        pagination={pagination}
        rowKey={(record) => `${record.createById}-${record.campusId}`}
        scroll={{ x: 500 }}
        rowClassName="hover:cursor-pointer"
        onChange={handleTableChange}
      />
      <AddUserToCampusModal
        ref={addUserToCampusModalRef}
        userInfo={userInfo}
        onUpdate={handleSearch}
      />
    </div>
  )
}
export default CampusUserTable
