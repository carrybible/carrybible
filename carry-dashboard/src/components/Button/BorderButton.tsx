import Button from '@components/Button/index'
import { ButtonProps } from 'antd'
import classNames from 'classnames'
import React from 'react'

type Props = Omit<ButtonProps, 'type' | 'danger' | 'ghost'>

const BorderButton: React.FC<
  Props & { type?: 'primary' | 'secondary' | 'danger'; activated?: boolean }
> = (props) => {
  const { activated } = props
  return (
    <Button
      type="secondary"
      {...props}
      className={classNames(
        activated && 'border-primary-override',
        props.className
      )}
    />
  )
}

export default BorderButton
