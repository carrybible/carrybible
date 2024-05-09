import SearchBox from '@components/SearchBox'
import { useTranslation } from 'next-i18next'
import React from 'react'

const TemplePlanHeader = ({
  onSearchChange,
  searchText,
}: {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  searchText: string
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col justify-between sm:flex-row">
      <div className="flex w-full flex-col sm:w-1/2">
        <SearchBox
          placeholder={t('plans.search-plans-text')}
          onChange={onSearchChange}
          value={searchText}
        />
      </div>
    </div>
  )
}

export default TemplePlanHeader
