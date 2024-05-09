import ButtonMore, { ButtonMoreProps } from '@components/ButtonMore'
import { H3, Text } from '@components/Typography'
import classNames from 'classnames'
import React, { ForwardRefRenderFunction } from 'react'

type Props = {
  icon: string
  type: string
  description: string
  className?: string
  buttonMore?: ButtonMoreProps
  isReadOnly?: boolean
}

const ActivityRowBlock: ForwardRefRenderFunction<
  HTMLDivElement | null,
  Props
> = ({ isReadOnly = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'flex flex-1 flex-row justify-between',
        'px-6 py-6 ',
        'items-center bg-neutral-10',
        props.className
      )}
    >
      <div className="flex flex-row items-center">
        <H3 className="mr-3 mb-0 rounded-full bg-neutral-50 p-5">
          {props.icon}
        </H3>
        <div className={classNames('flex flex-col pl-6')}>
          <Text strong>{props.type}</Text>
          <Text className="text-neutral-80">{props.description}</Text>
        </div>
      </div>
      {!isReadOnly ? (
        <ButtonMore
          className="h-[48px] w-[48px]"
          data={props.buttonMore?.data || []}
          onClick={props.buttonMore?.onClick}
        />
      ) : null}
    </div>
  )
}

export default React.forwardRef(ActivityRowBlock)
