import Plus from '@assets/icons/Plus.svg'
import Button from '@components/Button'
import SearchBox from '@components/SearchBox'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React from 'react'

const CampusesHeader = ({
  onSearchChange,
  searchText,
  onCreateCampusClick,
}: {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  searchText: string
  onCreateCampusClick: () => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="my-6 flex flex-col justify-between sm:flex-row">
      <div className="flex w-full flex-col sm:w-1/2">
        <SearchBox
          placeholder={t('campuses.search-ministries')}
          onChange={onSearchChange}
          value={searchText}
        />
      </div>
      <div className="flex w-full sm:block sm:w-fit">
        <Button
          className="mt-6 flex h-fit flex-1 items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
          icon={
            <div className="mr-1 flex">
              <Image src={Plus} alt="plus-icon" width={15} height={15} />
            </div>
          }
          onClick={onCreateCampusClick}
        >
          {t('campuses.add-a-campus')}
        </Button>
      </div>
    </div>
  )
}

export default CampusesHeader
