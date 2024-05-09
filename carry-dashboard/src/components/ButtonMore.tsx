import Image from 'next/image'
import React, { FC, useMemo } from 'react'
import ThreeDots from '@assets/icons/ThreeDots.svg'
import { Button, Dropdown, Menu, MenuProps } from 'antd'
import classNames from 'classnames'

export type ButtonMoreProps = {
  data: Array<{
    label: string
    key: string
    icon?: any
    danger?: boolean
  }>
  onClick?: MenuProps['onClick']
  disabled?: boolean
  className?: string
}

const ButtonMore: FC<ButtonMoreProps> = (props) => {
  const menu = useMemo(() => {
    const data = props.data?.map((m) => ({
      ...m,
      icon: <div className="flex h-7 w-7 items-center">{m.icon}</div>,
    }))
    return (
      <Menu
        items={data}
        onClick={(e) => {
          props.onClick?.(e)
          e.domEvent.stopPropagation()
        }}
      />
    )
  }, [props])

  if (!props.data || props.data.length === 0) {
    return null
  }

  return (
    <Dropdown
      overlay={menu}
      overlayClassName="dropdown"
      placement="bottom"
      disabled={props.disabled}
    >
      <Button
        className={classNames(
          'flex h-[33px] w-[33px] items-center justify-center rounded',
          'border-[2px] border-solid border-neutral-50 px-0 py-0',
          props.className
        )}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Image src={ThreeDots} alt="three-dots" width={48} height={7} />
      </Button>
    </Dropdown>
  )
}

export default ButtonMore
