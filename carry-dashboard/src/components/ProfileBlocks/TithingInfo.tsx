import ButtonMore, { ButtonMoreProps } from '@components/ButtonMore'
import { H4, Text } from '@components/Typography'
import { Image } from 'antd'
import classNames from 'classnames'
import React, { FC, ReactNode } from 'react'

type Props = {
  avatar: string | undefined
  name: string | undefined
  duration?: number
  className?: string
  buttonMore?: ButtonMoreProps
  button?: ReactNode
  columns?: Array<React.ReactNode>
  buttonMoreClassName?: string
  description?: string
}

const TithingInfo: FC<Props> = (props) => {
  return (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'bg-neutral-10',
        props.className
      )}
    >
      <div
        className={classNames(
          'flex justify-between',
          'px-6 pt-6 pb-5',
          'border-0  border-solid border-neutral-50',
          props.columns && 'border-b-2'
        )}
      >
        <div className="flex flex-row items-center">
          <Image
            id="plan-image"
            className="h-16 w-16 rounded-2xl sm:h-28 sm:w-28"
            src={props.avatar}
            alt="avatar"
            preview={false}
          />
          <div className="ml-6">
            {props.name ? <H4>{props.name}</H4> : null}
            {props.description ? (
              <Text className="text-neutral-80 ">{props.description}</Text>
            ) : null}
          </div>
        </div>
        {props.buttonMore && (
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-center space-x-3">
              <div className="hidden h-[50px] justify-end sm:flex">
                {props.button}
              </div>
              <ButtonMore
                className="sm:h-[60px] sm:w-[60px] sm:rounded-lg"
                data={props.buttonMore?.data}
                onClick={props.buttonMore?.onClick}
              />
            </div>
            <div />
          </div>
        )}
      </div>
      {props.columns && (
        <div
          className={classNames(
            'flex flex-col flex-wrap justify-between gap-4 sm:flex-row',
            'mt-6',
            'px-6 pb-6'
          )}
        >
          {props.columns?.map((col) => col)}
        </div>
      )}
      <div className="mb-4 flex w-full justify-center sm:hidden">
        {props.button}
      </div>
    </div>
  )
}

export default TithingInfo
