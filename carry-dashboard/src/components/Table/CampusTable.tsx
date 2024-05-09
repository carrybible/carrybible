import Pencil from '@assets/icons/Pencil.svg'
import Plus from '@assets/icons/Plus.svg'
import Button from '@components/Button'
import ButtonMore from '@components/ButtonMore'
import { CampusEmpty } from '@components/EmptyStates'
import SearchBox from '@components/SearchBox'
import Table from '@components/Table/index'
import { LargerText } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
// import Permissions from '@shared/Permissions'
import { Avatar, message, TablePaginationConfig, TableProps } from 'antd'
import { SorterResult } from 'antd/es/table/interface'
import classNames from 'classnames'

import CampusCreationModal, {
  CampusCreationModalRef,
} from '@components/Modals/CampusCreationModal'
import { Campus, getCampuses } from '@shared/Firebase/campus'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 10

export type CampusTableDataType = {
  pagination: TablePaginationConfig
  searchText: string
  dataSource: Campus[] | null
}

const DashboardUsersTable: React.FC<{
  className?: string
  initData?: Partial<CampusTableDataType>
  onSync?: (data: CampusTableDataType) => void
}> = ({ className, initData, onSync }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me)
  const campusCreationModalRef = useRef<CampusCreationModalRef>(null)
  const onClickCreateCampus = (campus?: Campus) =>
    campusCreationModalRef.current?.show(campus)
  const isMobile = useAppSelector((state) => state.app.isMobile)

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

  const CampusButtonMore = ({ campusInfo }: { campusInfo: Campus }) => {
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
            onClickCreateCampus?.(campusInfo)
          }
        }}
      />
    )
  }

  const columns: TableProps<Campus>['columns'] = [
    {
      key: 'church',
      title: 'CHURCH',
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
      key: 'groupCount',
      title: '# OF GROUPS',
      sorter: true,
      render: (_, { groupCount }) => {
        return <LargerText strong>{groupCount}</LargerText>
      },
      responsive: ['sm'],
    },
    {
      key: 'location',
      title: 'LOCATION',
      dataIndex: 'location',
      sorter: true,
      render: (_, { region, country, state, city }) => {
        const stateData = city || state
        const countryData = country || region
        const location = stateData
          ? countryData
            ? `${stateData}, ${countryData}`
            : stateData
          : ''

        return <LargerText>{location}</LargerText>
      },
      responsive: ['sm'],
    },
    {
      key: 'actions',
      render: (_, campus) => {
        return <CampusButtonMore campusInfo={campus} />
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
      orders?: {
        key: 'church' | 'groupCount' | 'location'
        order: 'asc' | 'desc'
      }[]
      showLoading?: boolean
    }) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        const result = await getCampuses({
          organisationId: me.organisation.id,
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
    },
    [me.organisation.id, searchText, t]
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
    sorter: SorterResult<Campus> | SorterResult<Campus>[]
  ) => {
    fetchData({
      pagination: newPagination,
      orders: (Array.isArray(sorter) ? sorter : [sorter])
        .filter((item) => !!item.column?.key)
        .map((item) => ({
          key: item.columnKey as 'church' | 'groupCount' | 'location',
          order: item.order === 'descend' ? 'desc' : 'asc',
        })),
    })
  }

  if (dataSource === null && !searchText) {
    return (
      <>
        <CampusEmpty onClick={() => onClickCreateCampus?.()} />
        <CampusCreationModal
          ref={campusCreationModalRef}
          onUpdate={handleSearch}
        />
      </>
    )
  }

  return (
    <div className={classNames('flex flex-col', className)}>
      <div
        className={classNames('mb-6 flex flex-col justify-between sm:flex-row')}
      >
        <SearchBox
          className="w-full sm:w-2/5"
          placeholder={t('campuses.search-ministries')}
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
          onClick={() => onClickCreateCampus?.()}
        >
          {t('campuses.add-a-campus')}
        </Button>
      </div>
      <Table<Campus>
        columns={columns}
        exportable={false}
        dataSource={dataSource || []}
        pagination={pagination}
        rowKey={(record) => record.id!!}
        scroll={{ x: isMobile ? 0 : 500 }}
        rowClassName="hover:cursor-pointer"
        onChange={handleTableChange}
      />
      <CampusCreationModal
        ref={campusCreationModalRef}
        onUpdate={handleSearch}
      />
    </div>
  )
}
export default DashboardUsersTable
