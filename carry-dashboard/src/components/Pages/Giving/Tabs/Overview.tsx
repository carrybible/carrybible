import React, { useCallback } from 'react'
import { useTranslation } from 'next-i18next'
import LineChart from '@components/Chart/LineChart'
import { FundReport } from '../FundReport'
import Select from '@components/Select'
import { useAppSelector } from '@redux/hooks'
import classNames from 'classnames'
import { Text } from '@components/Typography'

export type GivingReportType = {
  totalFunds: number
  totalFundsIncreasedPercent: number
  totalDonors: number
  totalDonorsIncrease: number
  totalFundsOvertime?: { [day: string]: number }
  symbol?: string
}

export const GivingOverviewTab: React.FC<{
  data: GivingReportType
  setCurrency: (currency: string) => void
  currency: string
}> = ({ data, setCurrency, currency }) => {
  const { t } = useTranslation()
  const giving = useAppSelector((state) => state.giving)

  const handleChangeCurrency = useCallback(
    (currentCurrenciesGiving: string) => {
      setCurrency(currentCurrenciesGiving)
    },
    [setCurrency]
  )
  return (
    <div className="mt-6 flex flex-wrap justify-between gap-y-6 gap-x-4">
      <div className={classNames('w-full', 'm-0 flex flex-row items-center')}>
        <Text className="pr-2 text-neutral-80">{t('giving.currency')}</Text>
        <Select
          options={giving?.currencies?.map((item) => ({
            key: item.value,
            value: item.value,
            label: `${item.flag} ${item.symbol} ${item.value}`,
          }))}
          defaultValue={currency}
          onChange={(currentCurrenciesGiving: string) => {
            handleChangeCurrency(currentCurrenciesGiving)
          }}
          placeholder={t('giving.currency')}
        />
      </div>
      <FundReport data={{ ...data }} />
      <LineChart
        title={t('giving.giving-overtime-chart-title')}
        className="min-h-[300px] w-full lg:w-[500px]"
        data={data?.totalFundsOvertime}
      />
    </div>
  )
}
