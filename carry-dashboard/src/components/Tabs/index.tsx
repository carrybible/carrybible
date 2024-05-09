import { Tabs as AntTabs, TabsProps } from 'antd'
import classNames from 'classnames'
import React from 'react'

interface Props extends TabsProps {}

const { TabPane } = AntTabs

const Tabs: React.FC<Props> = (props) => {
  return (
    <AntTabs
      {...props}
      className={classNames(props.className, 'text-base hover:border-primary')}
    >
      {props.children}
    </AntTabs>
  )
}

export { TabPane }
export default Tabs
