import { H2, Text } from '@components/Typography'
import classNames from 'classnames'
import * as React from 'react'

type Props = {
  className?: string
  stat: number | string
  title: string
  growUnit?: number | string
}

const RectangleStatBlock: React.FC<Props> = ({
  className,
  stat,
  title,
  growUnit,
}) => (
  <div
    className={classNames(
      'w-full px-6 py-10',
      'min-w-80 sm:h-40 sm:px-6 sm:py-10',
      'rounded-2xl border-2 border-solid border-neutral-50',
      'flex flex-row items-center bg-neutral-10',
      className
    )}
  >
    <div className="flex-1">
      <H2 strong className="mb-2 !text-[36px] sm:mb-0 sm:!text-[24px]">
        {stat}
      </H2>
      <Text className="text-neutral-80">{title}</Text>
    </div>
    <div
      className={classNames(
        'min-w-[100px] sm:h-full',
        'flex items-start justify-end',
        'h-full',
        'pt-1 sm:pt-0'
      )}
    >
      <Text
        className={classNames('rounded-3xl bg-info/25 px-3 py-1 text-info')}
        strong
      >
        {`+ ${growUnit}`}
      </Text>
    </div>
  </div>
)

export default RectangleStatBlock
