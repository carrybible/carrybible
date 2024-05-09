import { useAppSelector } from '@redux/hooks'
import { getCampuses } from '@shared/Firebase/campus'
import Downline from '@assets/icons/Downline.svg'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'
import Image from 'next/image'
import React, { useMemo, useRef, useState } from 'react'

function DebounceSelect({
  fetchOptions,
  debounceTimeout = 800,
  ...props
}: any) {
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState([])
  const fetchRef = useRef(0)
  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: any) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)
      fetchOptions(value).then((newOptions: any) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return
        }

        setOptions(newOptions)
        setFetching(false)
      })
    }

    return debounce(loadOptions, debounceTimeout)
  }, [fetchOptions, debounceTimeout])
  return (
    <Select
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
      suffixIcon={
        options.length ? (
          <Image
            className="justify-end self-end text-neutral-70"
            src={Downline}
            alt="Downline"
          />
        ) : null
      }
    />
  )
} // Usage of DebounceSelect

async function fetchUserList(searchText: string, orgId: string) {
  if (searchText) {
    const campuses = await getCampuses({
      search: searchText,
      organisationId: orgId,
      limit: 10,
      page: 1,
    })
    if (campuses.success) {
      return campuses.data.map((c) => ({
        label: c.name,
        value: c.id,
      }))
    }
  }
  return []
}

const SearchCampuses = ({ ...props }) => {
  const [value, setValue] = useState([])
  const me = useAppSelector((state) => state.me)
  return (
    <DebounceSelect
      showSearch
      value={value}
      fetchOptions={(searchText: string) =>
        fetchUserList(searchText, me.organisation.id)
      }
      onChange={(newValue: any) => {
        setValue(newValue)
      }}
      {...props}
    />
  )
}

export default SearchCampuses
