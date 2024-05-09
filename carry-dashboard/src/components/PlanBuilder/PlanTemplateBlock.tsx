import { H5, Text } from '@components/Typography'
import { Plan } from '@dts/Plans'
import { Button, Image } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
// import { useTranslation } from 'next-i18next'
import * as React from 'react'

type Props = {
  block: Plan
  className?: string
}

const PlanTemplateBlock: React.FC<Props> = ({ className, block }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const onClickPlan = () => {
    router.push(`template/${block.id}`)
  }

  return (
    <Button
      onClick={onClickPlan}
      className={classNames(
        'h-auto bg-[#fafafa]',
        'border-0 shadow-none',
        'flex flex-col',
        className
      )}
    >
      <div className="ant-image">
        <Image
          src={block.featuredImage}
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
          preview={false}
        />
        <div className="ant-image-mask">
          <div className="ant-image-mask-info">
            <span role="img" className="anticon anticon-eye"></span>
            Preview
          </div>
        </div>
      </div>
      <H5 className="my-2 whitespace-normal">{block.name}</H5>
      <Text className="mt-1 text-neutral-80">
        {block.duration} {block.duration > 1 ? t('days') : t('day')}
      </Text>
    </Button>
  )
}

export default PlanTemplateBlock
