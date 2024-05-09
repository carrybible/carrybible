import { ArrowLeft, ArrowRight } from '@components/Table/components/Arrow'
import { TithingFund } from '@dts/Giving'
import { Empty, Pagination, PaginationProps } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'
import FundBlock from './FundBlock'

type Props = {
  funds: TithingFund[] | undefined
}

const DEFAULT_PAGE_SIZE = 12

const FundList: React.FC<Props> = ({ funds }) => {
  const [current, setCurrent] = useState<number>(1)

  const onChangePage: PaginationProps['onChange'] = (page: number) => {
    setCurrent(page)
  }

  const data = useMemo(() => {
    if (current > 1) {
      return funds?.slice(
        (current - 1) * DEFAULT_PAGE_SIZE,
        current * DEFAULT_PAGE_SIZE
      )
    }
    if (current === 1) {
      return funds?.slice(0, DEFAULT_PAGE_SIZE)
    }
    return []
  }, [funds, current])

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

  return (
    <>
      {data?.length === 0 ? (
        <div className="flex w-full flex-col">
          <div className="sm: flex w-full justify-center pt-2 sm:pt-10">
            <Empty />
          </div>
        </div>
      ) : (
        <div>
          <div
            className={classNames(
              'grid grid-cols-2 gap-4 sm:grid-cols-4',
              'justify-start',
              'mt-6'
            )}
          >
            {data?.map((fund, index) => {
              return (
                <FundBlock key={index} className="px-0 sm:py-6" block={fund} />
              )
            })}
          </div>
          <div className="flex justify-center pt-6">
            <Pagination
              showLessItems={false}
              showSizeChanger={false}
              hideOnSinglePage={true}
              itemRender={pagingItemRender}
              onChange={onChangePage}
              total={funds?.length}
              pageSize={DEFAULT_PAGE_SIZE}
              current={current}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default FundList
