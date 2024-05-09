import Button from '@components/Button'
import ButtonMore, { ButtonMoreProps } from '@components/ButtonMore'
import { H4, Text } from '@components/Typography'
import { Block } from '@dts/Plans'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { FC, useState } from 'react'

type Props = {
  className?: string
  block: Block
  isOutOfSynced: boolean
  buttonMore?: ButtonMoreProps
  onSaveDay?: () => void
  isReadOnly?: boolean
}

const DayInfo: FC<Props> = ({
  block,
  className,
  buttonMore,
  onSaveDay,
  isOutOfSynced,
  isReadOnly = false,
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  return (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'bg-neutral-10',
        className
      )}
    >
      <div
        className={classNames(
          'flex justify-between',
          'px-6 py-9',
          'border-0 border-solid border-neutral-50'
        )}
      >
        <div className="flex w-full flex-row items-center justify-between">
          <div>
            <H4>{block.name}</H4>
            <Text className="text-neutral-80">
              {t('plans.day-index', { indexValue: block.dayIndex })}
            </Text>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-center space-x-3">
              <div className="hidden h-[50px] justify-end sm:flex">
                {!isReadOnly ? (
                  <Button
                    disabled={loading || !isOutOfSynced}
                    loading={loading}
                    className="h-[48px] w-[180px]"
                    onClick={async () => {
                      setLoading(true)
                      await onSaveDay?.()
                      setLoading(false)
                    }}
                  >
                    {t('plans.save-day')}
                  </Button>
                ) : (
                  <Button
                    loading={loading}
                    className="h-[48px] w-[180px]"
                    onClick={() => router.back()}
                  >
                    {t('go-back')}
                  </Button>
                )}
              </div>
              {buttonMore && (
                <ButtonMore
                  className="sm:h-[60px] sm:w-[60px] sm:rounded-lg"
                  data={buttonMore?.data}
                  onClick={buttonMore?.onClick}
                />
              )}
            </div>
            <div />
          </div>
        </div>
      </div>
      <div className="mb-4 flex w-full justify-center sm:hidden">
        <Button
          disabled={loading || !isOutOfSynced}
          loading={loading}
          className="h-[48px] w-10/12 sm:w-[180px]"
          onClick={async () => {
            setLoading(true)
            await onSaveDay?.()
            setLoading(false)
          }}
        >
          {t('plans.save-day')}
        </Button>
      </div>
    </div>
  )
}

export default DayInfo
