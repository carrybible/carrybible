import { useTranslation } from 'next-i18next'
import React from 'react'
import StripeLogo from '@assets/images/StripeLogo.png'
import { H4, Text } from '@components/Typography'
import Image from 'next/image'
import classNames from 'classnames'
import Button from '@components/Button'
import { useAppSelector } from '@redux/hooks'

type BillingTabProps = {}

const BillingTab: React.FC<BillingTabProps> = () => {
  const { t } = useTranslation()
  const organisation = useAppSelector((state) => state.organisation.info)

  return (
    <div>
      <H4 className="mt-6">{t('settings.billing-title')}</H4>
      <div
        className={classNames(
          'mt-6 py-10 px-6',
          'flex flex-row',
          'rounded-2xl',
          'bg-neutral-10'
        )}
      >
        <Image src={StripeLogo} width={214} height={160} alt="StripeLogo" />
        <div className="ml-6 mr-3 justify-center">
          <H4>{t('settings.billing-desc-title')}</H4>
          <Text className="text-center text-neutral-80 sm:text-start">
            {t('settings.billing-desc')}
          </Text>
        </div>
        <Button
          type="primary"
          className="h-fit w-full self-center sm:w-auto"
          target="blank"
          href={organisation?.billing?.url}
        >
          {t('settings.view-billing')}
        </Button>
      </div>
    </div>
  )
}

export default BillingTab
