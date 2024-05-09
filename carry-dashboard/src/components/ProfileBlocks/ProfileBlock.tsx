import ButtonMore, { ButtonMoreProps } from '@components/ButtonMore'
import MemberAvatar from '@components/MemberAvatar'
import { H4, Text } from '@components/Typography'
import classNames from 'classnames'
import React, { FC } from 'react'

type Props = {
  avatar: string
  name: string
  description?: string
  className?: string
  buttonMore?: ButtonMoreProps
  columns?: Array<React.ReactNode>
}

const ProfileBlock: FC<Props> = (props) => {
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
          'border-0 border-b-2 border-solid border-neutral-50'
        )}
      >
        <div className="flex flex-row items-center">
          <MemberAvatar
            src={props.avatar}
            className="h-16 w-16 sm:h-28 sm:w-28"
            alt="avatar"
          />
          <div className="ml-3 sm:ml-6">
            <H4>{props.name}</H4>
            <Text>{props.description}</Text>
          </div>
        </div>
        {props.buttonMore && (
          <div>
            <ButtonMore
              className="sm:h-[60px] sm:w-[60px] sm:rounded-lg"
              data={props.buttonMore?.data}
              onClick={props.buttonMore?.onClick}
            />
          </div>
        )}
      </div>
      <div
        className={classNames(
          'flex flex-col flex-wrap justify-between gap-4 sm:flex-row',
          'mt-6',
          'px-6 pb-6'
        )}
      >
        {props.columns?.map((col) => col)}
      </div>
    </div>
  )
}

export default ProfileBlock
