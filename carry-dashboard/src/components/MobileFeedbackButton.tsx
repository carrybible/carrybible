import React from 'react'
import classNames from 'classnames'
import { FaRegQuestionCircle } from 'react-icons/fa'
import { Text } from '@components/Typography'
import { useTranslation } from 'next-i18next'

export const MobileFeedbackButton = () => {
  const { t } = useTranslation()

  return (
    <div
      id="carry-feedback"
      className={classNames(
        'mb-4 rounded-lg px-2.5 py-5',
        'hover:cursor-pointer hover:bg-primary/5 hover:shadow-[0px_8px_15px_0px_rgba(0,0,0,0.05)]'
      )}
    >
      <Text
        strong
        className={classNames(
          'inline-flex flex-row items-center gap-5 text-primary',
          'hover:text-primary/80 active:text-primary-light'
        )}
      >
        <FaRegQuestionCircle /> {t('help-feedback')}
      </Text>
    </div>
  )
}
