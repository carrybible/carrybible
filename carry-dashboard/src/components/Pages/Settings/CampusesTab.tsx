import { H4 } from '@components/Typography'
import { useTranslation } from 'next-i18next'

import React, { FC } from 'react'
import CampusTable from '@components/Table/CampusTable'

type CampusesTabProps = {}

const CampusesTab: FC<CampusesTabProps> = () => {
  const { t } = useTranslation()

  return (
    <div>
      <H4 className="my-6">{t('settings.campuses')}</H4>
      <CampusTable className="mt-4" />
    </div>
  )
}

export default CampusesTab
