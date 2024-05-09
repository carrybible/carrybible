import _ from 'lodash'
import React from 'react'
import { Avatar } from 'antd'
import { AvatarSize } from 'antd/lib/avatar/SizeContext'
import classNames from 'classnames'

const MemberAvatar = ({
  src,
  className,
  alt,
  size,
  shape = 'circle',
}: {
  src: string
  className?: string
  alt?: string
  size?: number | AvatarSize
  shape?: 'square' | 'circle'
}) => {
  let uri = _.clone(src)

  if (uri && uri.includes('//graph.facebook.com')) {
    uri += `${_.split(src, '.com')[1].includes('?') ? '&' : '?'}`
    uri += 'width=400&height=400'
  }

  return (
    <Avatar
      src={uri}
      size={size}
      alt={alt}
      className={classNames(className, shape === 'square' ? 'rounded-2xl' : '')}
      shape={shape}
    />
  )
}

export default MemberAvatar
