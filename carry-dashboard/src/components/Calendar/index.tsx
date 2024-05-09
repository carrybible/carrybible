import { DatePicker as AntdDatePicker, DatePickerProps } from 'antd'
import classNames from 'classnames'
import React from 'react'

export type DatePickerCustomProps = DatePickerProps & {
  className?: string
}

const DatePicker = (props: DatePickerCustomProps) => {
  const { className, ...nest } = props
  return (
    <AntdDatePicker
      {...nest}
      className={classNames(
        className,
        'my-4 rounded-[10px] border-2 border-solid bg-neutral-10 py-2 px-5',
        'w-full',
        'border-neutral-50 hover:!border-primary/50',
        'focus:!border-r-2 focus:!border-primary focus:!shadow-primary-light'
      )}
    />
  )
}

export default DatePicker
