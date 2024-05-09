import { ButtonProps, Button as AntButton } from 'antd'
import classNames from 'classnames'
import React from 'react'

type Props = Omit<ButtonProps, 'type' | 'danger' | 'ghost'>

const Button: React.FC<
  Props & { type?: 'primary' | 'secondary' | 'danger' }
> = ({ type = 'primary', ...props }) => {
  const { shape = 'default', disabled } = props
  return (
    <AntButton
      {...props}
      className={classNames(
        'flex h-auto min-h-[46px] items-center justify-center gap-x-2 py-2 px-6 before:opacity-0',
        shape === 'default' && 'rounded-[10px]',
        type === 'primary' &&
          !disabled &&
          'bg-btn-hover shadow-hover bg-primary text-neutral-10 hover:border-primary hover:text-neutral-10 focus:border-primary focus:text-neutral-10 active:border-primary active:text-neutral-10',
        type === 'primary' &&
          disabled &&
          'border-0 disabled:bg-primary/50 disabled:text-neutral-10 hover:disabled:bg-primary/50 hover:disabled:text-neutral-10',
        type === 'secondary' && 'border-2 border-solid border-neutral-50',
        type === 'secondary' &&
          !disabled &&
          'shadow-hover bg-neutral-10 text-neutral-80 hover:border-neutral-50 hover:text-neutral-80',
        type === 'secondary' &&
          disabled &&
          'disabled:border-neutral-50 disabled:opacity-50',
        type === 'danger' &&
          !disabled &&
          'bg-danger text-neutral-10 hover:border-danger hover:text-neutral-10 focus:border-danger focus:text-neutral-10 active:border-danger active:text-neutral-10',
        type === 'danger' &&
          disabled &&
          'border-0 disabled:bg-danger/50 disabled:text-neutral-10 hover:disabled:bg-danger/50 hover:disabled:text-neutral-10',
        props.className
      )}
    />
  )
}

export default Button
