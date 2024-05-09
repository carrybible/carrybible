import React from 'react'
import RectangleStatBlock from '@components/StatBlock/RectangleStatBlock'
import { useTranslation } from 'next-i18next'
import { toCurrency } from '@shared/Utils'

export interface FundReportProps {
  data: {
    totalFunds: number
    totalFundsIncreasedPercent: number
    totalDonors: number
    totalDonorsIncrease: number
    symbol?: string
  }
}

export const FundReport = (props: FundReportProps) => {
  const {
    totalFunds,
    totalFundsIncreasedPercent,
    totalDonors,
    totalDonorsIncrease,
    symbol,
  } = props.data
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-y-6">
      <RectangleStatBlock
        stat={`${symbol || '$'}${toCurrency(totalFunds ?? 0)}`}
        title={t('giving.total-funds')}
        growUnit={`${toCurrency(totalFundsIncreasedPercent ?? 0)} %`}
      />
      <RectangleStatBlock
        stat={totalDonors ?? 0}
        title={t('giving.total-donors')}
        growUnit={`${totalDonorsIncrease ?? 0} ${t('new')}`}
      />
    </div>
  )
}
