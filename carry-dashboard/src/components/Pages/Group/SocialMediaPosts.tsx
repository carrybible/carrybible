import { ArrowLeft, ArrowRight } from '@components/Table/components/Arrow'
import { GroupDetailType } from '@shared/Firebase/group'
import { Empty, Pagination, PaginationProps } from 'antd'
import classNames from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'
import { SocialMediaPost } from '../../../dts/Group'
import PlanSocialMediaPost from './PlanSocialMediaPost'

type Props = {
  posts: SocialMediaPost[]
  onClick: (a: SocialMediaPost) => void
  group: GroupDetailType
}

const DEFAULT_PAGE_SIZE = 8

const SocialMediaPosts: React.FC<Props> = ({ group, posts, onClick }) => {
  const [current, setCurrent] = useState<number>(1)

  const onChangePage: PaginationProps['onChange'] = (page: number) => {
    setCurrent(page)
  }

  const data = useMemo(() => {
    if (current > 1) {
      return posts?.slice(
        (current - 1) * DEFAULT_PAGE_SIZE,
        current * DEFAULT_PAGE_SIZE
      )
    }
    if (current === 1) {
      return posts?.slice(0, DEFAULT_PAGE_SIZE)
    }
    return []
  }, [posts, current])

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
            {data?.map((post, index) => {
              return (
                <PlanSocialMediaPost
                  key={index}
                  post={post}
                  type="table"
                  onClick={onClick}
                  group={group}
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
              total={posts?.length}
              pageSize={DEFAULT_PAGE_SIZE}
              current={current}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default SocialMediaPosts
