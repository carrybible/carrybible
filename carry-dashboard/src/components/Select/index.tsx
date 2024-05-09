import Downline from '@assets/icons/Downline.svg'
import { Select as AntSelect, SelectProps } from 'antd'
import classNames from 'classnames'
import Image from 'next/image'
import React from 'react'

type Props = SelectProps

const Select: React.FC<Props> = (props) => {
  return (
    <AntSelect
      {...props}
      className={classNames(
        props.className,
        'bg-neutral-10 text-base hover:border-primary/50'
      )}
      dropdownClassName="rounded-[10px] py-3 border-solid border-neutral-50 text-neutral-100 border-2"
      suffixIcon={
        <Image
          className="justify-end self-end text-neutral-70"
          src={Downline}
          alt="Downline"
        />
      }
    />
  )
}
export default Select
