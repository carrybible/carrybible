import classNames from 'classnames'
import React, { ForwardRefRenderFunction } from 'react'
import { Input as AntInput, InputProps, InputRef } from 'antd'

const Input: ForwardRefRenderFunction<InputRef, InputProps> = (props, ref) => {
  return (
    <AntInput
      ref={ref}
      {...props}
      className={classNames(
        props.className,
        'rounded-[10px] border-2 border-solid bg-neutral-10 py-2.5 px-5',
        'focus:!border-r-2 focus:!shadow-primary-light',
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

export default React.forwardRef(Input)
