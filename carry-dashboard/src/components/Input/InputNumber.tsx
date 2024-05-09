import { InputNumber as AntInputNumber, InputNumberProps } from 'antd'
import classNames from 'classnames'
import React, { ForwardRefRenderFunction } from 'react'

const InputNumber: ForwardRefRenderFunction<
  HTMLInputElement,
  InputNumberProps
> = (props, ref) => {
  return (
    <AntInputNumber
      ref={ref}
      {...props}
      className={classNames(
        props.className,
        'rounded-[10px] border-2 border-solid bg-neutral-10 py-1.5 px-5',
        'w-full',
        'border-neutral-50 hover:!border-primary/50',
        'focus:!border-r-2 focus:!border-primary focus:!shadow-primary-light',
        {
          'border-neutral-50 hover:!border-primary/50 focus:!border-primary':
            !props.status,
          'border-danger hover:!border-danger/50 focus:!border-danger':
            props.status === 'error',
        }
      )}
    />
  )
}

export default React.forwardRef(InputNumber)
