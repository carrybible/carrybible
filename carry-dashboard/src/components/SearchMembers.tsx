import { findMembers } from '@shared/Firebase/member'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'
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
    />
  )
} // Usage of DebounceSelect

async function fetchUserList(searchText: string) {
  if (searchText) {
    const members = await findMembers({ searchText })
    return members.map((m) => ({
      label: m.name,
      value: m.uid,
    }))
  }
  return []
}

const SearchMembers = ({ ...props }) => {
  const [value, setValue] = useState([])
  return (
    <DebounceSelect
      showSearch
      value={value}
      fetchOptions={fetchUserList}
      onChange={(newValue: any) => {
        setValue(newValue)
      }}
      {...props}
    />
  )
}

export default SearchMembers
