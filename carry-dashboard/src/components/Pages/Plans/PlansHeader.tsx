import Plus from '@assets/icons/Plus.svg'
import Button from '@components/Button'
import SearchBox from '@components/SearchBox'
import Select from '@components/Select'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import Downline from '@assets/icons/Downline.svg'
import { useAppSelector } from '@redux/hooks'

const PlansHeader = ({
  onSearchChange,
  handleSearch,
  searchText,
  onCreatePlanClick,
  className,
  onFilterCampus,
}: {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSearch: () => void
  searchText: string
  onCreatePlanClick: () => void
  className?: string
  onFilterCampus?: (value: string) => void
}) => {
  const { t } = useTranslation()
  const [filteringCampus, setFilteringCampus] = useState('')
  const org = useAppSelector((state) => state.organisation)
  const me = useAppSelector((state) => state.me)
  const campusOptions = useMemo(() => {
    const data = me.campusAccess?.map((i) => ({
      key: i.id,
      label: i.name || i.id,
      value: i.id,
    }))
    if (data?.length && data.length > 1) {
      return [
        { key: '1', label: 'All Campuses', value: '' },
        { key: '2', label: org.info?.name + ' Org', value: '-1' },
      ].concat(data as any)
    }

    return [
      { key: '1', label: 'All Campuses', value: '' },
      { key: '2', label: org.info?.name + ' Org', value: '-1' },
    ]
  }, [me?.campusAccess])
  return (
    <>
      <div
        className={classNames(
          'flex flex-col justify-between sm:flex-row',
          className
        )}
      >
        <div className="flex w-full flex-col sm:w-1/2">
          <SearchBox
            placeholder={t('plans.search-plans-text')}
            onChange={onSearchChange}
            onPressEnter={handleSearch}
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
            onClick={onCreatePlanClick}
          >
            {t('plans.create-plan')}
          </Button>
        </div>
      </div>
      {campusOptions?.length > 1 ? (
        <Select
          options={campusOptions}
          placeholder={t('group.group-by')}
          className="mt-6 w-full sm:w-2/5"
          value={filteringCampus}
          onChange={(value) => {
            setFilteringCampus(value)
            onFilterCampus?.(value)
          }}
          suffixIcon={
            <Image
              className="justify-end self-end text-neutral-70"
              src={Downline}
              alt="Downline"
            />
          }
        />
      ) : null}
    </>
  )
}

export default PlansHeader
