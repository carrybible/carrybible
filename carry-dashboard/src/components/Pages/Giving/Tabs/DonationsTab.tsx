import React, { FC, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@redux/hooks'
import DonationTable from '@components/Table/DonationTable'
import { getGiving, GivingResponse } from '@shared/Firebase/giving'

type DonationsTabProps = {}

const DonationsTab: FC<DonationsTabProps> = () => {
  const [filteringCampus, setFilteringCampus] = useState('')
  const [filteringCampaign, setFilteringCampaign] = useState('')
  const [filterGivingOption, setFilterGivingOption] = useState<
    GivingResponse[]
  >([])
  const [filterGivingOptionSelect, setFilterGivingOptionSelect] = useState<
    {
      key: string
      label: string
      value: string
    }[]
  >([])
  const [filteringFund, setFilteringFund] = useState('')
  const [filterGiving, setFilterGiving] = useState('')
  const [reload, setReload] = useState(false)
  const me = useAppSelector((state) => state.me)
  const campusOptions = useMemo(() => {
    const data = me.campusAccess?.map((i) => ({
      key: i.id,
      label: i.name || i.id,
      value: i.id,
    }))
    if (data?.length && data.length > 1) {
      return [{ key: '1', label: 'All', value: '' }].concat(data as any)
    }

    return [{ key: '1', label: 'All', value: '' }]
  }, [me?.campusAccess])

  useEffect(() => {
    const fetchFilter = async () => {
      const givings = await getGiving()
      setFilterGivingOption(givings)
      const list = [
        {
          key: 'options-all',
          label: 'All',
          value: '',
          image: '',
        },
        ...givings.map((item) => ({
          key: item.id || '',
          label: item.name || item.id,
          value: item.id,
        })),
      ]
      setFilterGivingOptionSelect(list)
    }

    fetchFilter()
  }, [me.organisation.id])

  return (
    <div>
      <div className="mt-5">
        <DonationTable
          campusId={filteringCampus}
          givingId={filterGiving}
          campaignId={filteringCampaign}
          fundId={filteringFund}
          reload={reload}
          setReload={(isReload) => setReload(isReload)}
          campusOption={campusOptions}
          filterGiving={filterGivingOption}
          givingOption={filterGivingOptionSelect}
          setFilterGiving={setFilterGiving}
          setFilteringCampaign={setFilteringCampaign}
          setFilteringCampus={setFilteringCampus}
          setFilteringFund={setFilteringFund}
        />
      </div>
    </div>
  )
}

export default DonationsTab
