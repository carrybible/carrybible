import DebounceSelect from '@components/Select/DebounceSelect'
import Tag from '@components/Tag'
import { useAppSelector } from '@redux/hooks'
import { Campus, getCampuses } from '@shared/Firebase/campus'
import type { SelectProps } from 'antd/es/select'
import { keyBy } from 'lodash'
import { useTranslation } from 'next-i18next'
import React, { FC, useCallback, useMemo, useState } from 'react'
import SelectResult from './SelectResult'

type OptionType<T> = {
  data: T
  value: string
  label: string
}

interface Props extends SelectProps {
  value?: Campus
  onChange?: (value?: Campus) => void
}

const CampusInput: FC<Props> = (props) => {
  const { onChange, value: initValue } = props

  const me = useAppSelector((state) => state.me)
  const { t } = useTranslation()

  const transformOptions = useCallback((options: Campus[]) => {
    return options.map((item) => ({
      value: item.id!,
      label: item.name!,
      data: item,
    }))
  }, [])

  const [values, setValues] = useState<OptionType<Campus>[]>(
    transformOptions(initValue ? [initValue] : [])
  )
  const [valuesOptions, setValuesOptions] = useState<
    OptionType<Campus>[] | undefined
  >()
  const valuesMap = useMemo(() => keyBy(values, 'value'), [values])

  const fetchDataList = useCallback(
    async (searchText: string): Promise<Campus[]> => {
      const searchData = await getCampuses({
        search: searchText,
        organisationId: me.organisation.id,
        limit: 5,
        page: 1,
      })
      return searchData.data.filter((item) => !!item.id)
    },
    [me.organisation.id]
  )

  const onOptionsChange = useCallback(
    (newOptions: Campus[]) => {
      setValuesOptions(transformOptions(newOptions))
    },
    [transformOptions]
  )

  const onClickItem = useCallback(
    (newOption: { value: string }) => {
      const newValue = valuesOptions?.find(
        (item) => item.value === newOption.value
      )
      if (newValue) {
        setValues((curValues) => [
          ...curValues,
          ...transformOptions([newValue.data]),
        ])
      }
      onChange?.(newValue?.data)
    },
    [onChange, transformOptions, valuesOptions]
  )

  const onCloseItem = useCallback(
    (removeOption: { value: string }) => {
      setValues((curValues) =>
        curValues.filter((curValues) => curValues.value !== removeOption.value)
      )
      onChange?.(undefined)
    },
    [onChange]
  )

  return (
    <div>
      <DebounceSelect
        {...props}
        mode="multiple"
        value={values}
        fetchOptions={fetchDataList}
        transformOptions={transformOptions}
        onOptionsChange={onOptionsChange}
        tagRender={(props) => (
          <Tag
            {...props}
            option={values.map((valueItem) => ({
              label: valueItem.data.name!,
              value: valueItem.data.id!,
              avatar: valueItem.data.image!,
            }))}
            onCloseItem={onCloseItem}
            type="user"
          />
        )}
        dropdownStyle={{ display: 'none' }}
        maxTagTextLength={30}
        autoClearSearchValue={false}
      />
      <SelectResult
        selectTitle={t('group.select-a-campus')}
        searchResult={
          values.length > 0
            ? []
            : valuesOptions
                ?.filter((item) => !valuesMap[item.value])
                .map((item) => ({
                  label: item.data.name!,
                  value: item.data.id!,
                  avatar: item.data.image!,
                }))
        }
        onClickItem={onClickItem}
        searchingTitle={t('group.keep-typing-to-invite')}
      />
    </div>
  )
}

export default CampusInput
