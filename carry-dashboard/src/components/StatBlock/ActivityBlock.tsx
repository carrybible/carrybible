import { H3, Text } from '@components/Typography'
import classNames from 'classnames'
import React, { FC } from 'react'

type Props = {
  textIcon: string
  count: number
  activityType: string
  className?: string
}

const ActivityBlock: FC<Props> = (props) => {
  return (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'flex flex-1 flex-row',
        'mx-2 my-2 px-6 py-6 ',
        'items-center bg-neutral-10',
        props.className
      )}
    >
      <H3 className="mr-3 mb-0">{props.textIcon}</H3>
      <div className={classNames('flex flex-col')}>
        <Text strong>{props.count}</Text>
        <Text className="text-neutral-80">{props.activityType}</Text>
      </div>
    </div>
  )
}

export default ActivityBlock
