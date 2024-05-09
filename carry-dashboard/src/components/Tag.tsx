import EnvelopeSimple from '@assets/icons/EnvelopeSimple.svg'
import X from '@assets/icons/X.svg'
import { Avatar, Tag as AntTag } from 'antd'
import classNames from 'classnames'
import { omit } from 'lodash'
import Image from 'next/image'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import React, { useMemo } from 'react'
import { UserValue } from './Input/GroupLeaderInput'

interface Props extends CustomTagProps {
  option?: {
    label: string
    value: string
    avatar?: string
  }[]
  onCloseItem?: (user: UserValue) => void
  type: 'group' | 'user'
}

const Tag = (props: Props) => {
  const { value, closable, onCloseItem, option = [], type } = props
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const user = useMemo((): UserValue => {
    const u = option.find((i) => i.value === value)
    return u as UserValue
  }, [option, value])

  return (
    <AntTag
      {...omit(props, ['onCloseItem'])}
      icon={
        props.type === 'group' ? null : user?.avatar ? (
          <Avatar
            src={user?.avatar || ''}
            alt="user-avatar"
            size={20}
            className="my-1 mx-1"
          />
        ) : (
          <div className="mr-3 flex items-center justify-center">
            <Image
              width={32}
              height={32}
              src={EnvelopeSimple}
              alt="envelop-icon"
            />
          </div>
        )
      }
      color={'#EDEEF3'}
      closeIcon={
        <div className="ml-3 flex items-center justify-center">
          <Image src={X} alt="remove-icon" className="self-center" />
        </div>
      }
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={type === 'user' ? () => onCloseItem?.(user!!) : props.onClose}
      className={classNames(
        'mr-[12px] rounded-md',
        'my-1 flex flex-row items-center bg-neutral-50'
      )}
      style={{ color: '#333333' }}
    >
      {user?.label}
    </AntTag>
  )
}

export default Tag
