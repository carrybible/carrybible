import { Input as AntInput } from 'antd'
import { TextAreaProps, TextAreaRef } from 'antd/lib/input/TextArea'
import classNames from 'classnames'
import React, { ForwardRefRenderFunction } from 'react'

const TextArea: ForwardRefRenderFunction<TextAreaRef, TextAreaProps> = (
  props,
  ref
) => {
  return (
    <AntInput.TextArea
      ref={ref}
      {...props}
      className={classNames(
        props.className,
        'rounded-[10px] border-2 border-solid bg-neutral-10 py-2.5 px-5',
        'border-neutral-50 hover:!border-primary/50',
        'focus:!border-r-2 focus:!border-primary focus:!shadow-primary-light'
      )}
    />
  )
}

export default React.forwardRef(TextArea)
