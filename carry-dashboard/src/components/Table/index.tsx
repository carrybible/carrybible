import DownloadSimple from '@assets/icons/DownloadSimple.svg'
import FunnelSimple from '@assets/icons/FunnelSimple.svg'
import SortDesc from '@assets/icons/SortDescending.svg'
import SortAsc from '@assets/icons/SortAscending.svg'
import Button from '@components/Button'
import { ArrowLeft, ArrowRight } from '@components/Table/components/Arrow'
import { LargerText } from '@components/Typography'
import { Table as AntTable, TableProps } from 'antd'
import { ColumnType, SortOrder } from 'antd/lib/table/interface'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { useCallback, useMemo } from 'react'
import { CSVLink } from 'react-csv'

const Title = ({
  text,
  hasSort,
  columnKey,
  sortColumns,
}: {
  text: string
  hasSort: boolean
  columnKey?: string
  sortColumns?: {
    column: ColumnType<any>
    order: SortOrder
  }[]
}) => {
  let titleNode = <LargerText strong>{text}</LargerText>

  if (hasSort) {
    const sortOrder: SortOrder =
      sortColumns?.find(({ column }) => column.key === columnKey)?.order ?? null
    return (
      <div className="item-centers flex gap-2">
        {titleNode}
        <Image
          src={
            sortOrder === 'descend'
              ? SortDesc
              : sortOrder === 'ascend'
              ? SortAsc
              : FunnelSimple
          }
          width={20}
          height={20}
          alt="sort"
        />
      </div>
    )
  }

  return titleNode
}

interface Props<RecordType> extends TableProps<RecordType> {}

function ExportableButton(props: {
  dataSource: any
  onClick?: () => Promise<string>
}) {
  const { onClick } = props
  const { t } = useTranslation()
  const Wrapper = onClick ? 'div' : CSVLink

  return (
    <Wrapper
      className={classNames('self-end', 'mb-9')}
      data={[...props.dataSource]}
      filename={'export.csv'}
      onClick={
        onClick
          ? async () => {
              const downloadLink = await onClick()
              if (downloadLink) {
                window.open(downloadLink)
              }
            }
          : undefined
      }
    >
      <Button
        type="secondary"
        icon={<Image src={DownloadSimple} alt="download-simple" />}
      >
        {t('export-as-csv')}
      </Button>
    </Wrapper>
  )
}

const Table = <RecordType extends object = any>(
  props: Props<RecordType> & {
    exportable?: boolean
    onExportClick?: () => Promise<string>
  }
) => {
  const pagingItemRender = useCallback(
    (
      page: number,
      type: 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next',
      element: React.ReactNode
    ): React.ReactNode => {
      if (type === 'page') {
        return <span className="text-base">{page}</span>
      }
      if (type === 'prev') {
        return <ArrowLeft />
      }
      if (type === 'next') {
        return <ArrowRight />
      }
      return element
    },
    []
  )

  // @ts-ignore
  const columns = useMemo<TableProps<RecordType>['columns']>(() => {
    return props.columns?.map((column) => ({
      ...column,
      title: (props) =>
        typeof column.title === 'string' ? (
          <Title
            text={column.title}
            hasSort={!!column.sorter}
            columnKey={column.key as string}
            sortColumns={props.sortColumns}
          />
        ) : (
          column.title
        ),
      className: classNames(column.className),
      render:
        // @ts-ignore
        column.render || column.dataIndex
          ? (value, record, index) => {
              let cellNode: React.ReactNode = (
                <LargerText className="text-neutral-80">{value}</LargerText>
              )
              if (column.render) {
                // @ts-ignore
                cellNode = column.render(value, record, index)
              }
              return cellNode
            }
          : undefined,
    }))
  }, [props.columns])

  return (
    <>
      {props.exportable && props.dataSource ? (
        <ExportableButton
          dataSource={props.dataSource}
          onClick={props.onExportClick}
        />
      ) : null}

      <AntTable
        showSorterTooltip={false}
        {...props}
        columns={columns}
        className={classNames(props.className)}
        rowClassName={classNames(`${props.rowClassName} hover:rounded-[15px]`)}
        pagination={{
          showLessItems: true,
          showSizeChanger: false,
          hideOnSinglePage: true,
          position: ['bottomCenter'],
          itemRender: pagingItemRender,
          ...(props.pagination ?? {}),
        }}
      />
    </>
  )
}

export default Table
