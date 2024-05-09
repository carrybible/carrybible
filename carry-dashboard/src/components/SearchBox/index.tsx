import Input from '@components/Input'
import { InputProps } from 'antd'
import Image from 'next/image'
import React, { FC } from 'react'

import MagnifyingGlass from '@assets/icons/MagnifyingGlass.svg'

type Props = InputProps

const SearchBox: FC<Props> = (props) => {
  return (
    <Input
      prefix={
        <Image
          className="self-end text-neutral-70"
          src={MagnifyingGlass}
          alt="MagnifyingGlass"
        />
      }
      {...props}
    />
  )
}

export default SearchBox
