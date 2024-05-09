/* eslint-disable @typescript-eslint/no-unused-vars */
import { H5, Text } from '@components/Typography'
import { TithingFund } from '@dts/Giving'
import { Button, Image } from 'antd'
import classNames from 'classnames'
import { capitalize } from 'lodash'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import * as React from 'react'

type Props = {
  block: TithingFund
  className?: string
}

const FundBlock: React.FC<Props> = ({ className, block }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const onClick = () => {
    router.push(`/tithing/${block.id}`)
  }

  return (
    <Button
      onClick={onClick}
      className={classNames(
        'h-auto bg-[#fafafa]',
        'border-0 shadow-none',
        'flex flex-col',
        'group w-full p-0'
      )}
    >
      <div className="ant-image">
        <Image
          preview={false}
          src={block.image}
          alt="template"
          className={classNames(
            'h-44 w-44',
            'sm:h-52 sm:w-52 sm:px-0 sm:py-0',
            'flex flex-col flex-wrap items-center justify-center',
            'rounded-[10px] object-cover',
            'text-lg font-bold text-neutral-100',
            'hover:border-[#a5a5a5]',
            className
          )}
        />
      </div>
      <H5 className="my-2 whitespace-normal group-hover:text-primary">
        {block.name}
      </H5>
      <Text className="text-neutral-80">{capitalize(block.status)}</Text>
    </Button>
  )
}

export default FundBlock
