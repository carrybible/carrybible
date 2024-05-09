import { Switch as AntdSwitch, SwitchProps } from 'antd'
import classNames from 'classnames'
import React from 'react'

export interface SwitchCustomProps extends SwitchProps {}

const Switch = (props: SwitchCustomProps) => {
  const { className, ...nest } = props
  return (
    <AntdSwitch {...nest} className={classNames('bg-primary', className)} />
  )
}

export default Switch
