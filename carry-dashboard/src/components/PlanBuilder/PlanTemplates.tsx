import { ArrowLeft, ArrowRight } from '@components/Table/components/Arrow'
import { Plan } from '@dts/Plans'
import { Pagination, PaginationProps } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'
import PlanTemplateBlock from './PlanTemplateBlock'

type Props = {
  plans?: Plan[]
}

const DEFAULT_PAGE_SIZE = 12

const PlanTemplates: React.FC<Props> = ({ plans }) => {
  const [current, setCurrent] = useState<number>(1)

  const onChangePage: PaginationProps['onChange'] = (page: number) => {
    setCurrent(page)
  }

  const data = useMemo(() => {
    if (current > 1) {
      return plans?.slice(
        (current - 1) * DEFAULT_PAGE_SIZE,
        current * DEFAULT_PAGE_SIZE
      )
    }
    if (current === 1) {
      return plans?.slice(0, DEFAULT_PAGE_SIZE)
    }
    return []
  }, [plans, current])

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
    <div className="flex flex-col">
      <div
        className={classNames(
          'grid grid-cols-2 gap-4 sm:grid-cols-4',
          'justify-start',
          'mt-6'
        )}
      >
        {data?.map((plan, index) => {
          return (
            <PlanTemplateBlock
              key={index}
              className="px-0 sm:py-6"
              block={plan}
            />
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
          total={plans?.length}
          pageSize={DEFAULT_PAGE_SIZE}
          current={current}
        />
      </div>
    </div>
  )
}

export default PlanTemplates
