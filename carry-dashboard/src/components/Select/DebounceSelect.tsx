import { Spin } from 'antd'
import { DefaultOptionType, SelectProps } from 'antd/es/select'
import { debounce } from 'lodash'
import { useMemo, useRef, useState } from 'react'

import Select from './index'

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  transformOptions: (value: ValueType[]) => DefaultOptionType[]
  fetchOptions: (search: string) => Promise<ValueType[]>
  onOptionsChange?: (values: ValueType[]) => void
  debounceTimeout?: number
}

const DebounceSelect = <ValueType extends any>({
  transformOptions,
  fetchOptions,
  debounceTimeout = 800,
  onOptionsChange,
  ...props
}: DebounceSelectProps<ValueType>) => {
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState<ValueType[]>([])
  const fetchRef = useRef(0)

  const debounceFetcher = useMemo(() => {
    const loadOptions = async (searchValue: string) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)

      const newOptions = await fetchOptions(searchValue)
      if (fetchId !== fetchRef.current) {
        return
      }
      setOptions(newOptions)
      onOptionsChange?.(newOptions)
      setFetching(false)
    }

    return debounce(loadOptions, debounceTimeout)
  }, [debounceTimeout, fetchOptions, onOptionsChange])

  return (
    <div className="relative">
      <Select
        filterOption={false}
        onSearch={debounceFetcher}
        notFoundContent={fetching ? <Spin size="small" /> : null}
        onFocus={(focusEvent) => {
          if (
            !props.value ||
            (Array.isArray(props.value) && props.value?.length === 0)
          )
            debounceFetcher('')
          props.onFocus?.(focusEvent)
        }}
        {...props}
        options={transformOptions(options)}
      />
      {fetching && (
        <Spin className="absolute top-[18px] right-[15px]" size="small" />
      )}
    </div>
  )
}

export default DebounceSelect
