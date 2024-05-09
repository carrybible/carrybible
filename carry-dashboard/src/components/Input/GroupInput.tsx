import DebounceSelect from '@components/Select/DebounceSelect'
import Tag from '@components/Tag'
import { Group } from '@redux/slices/group'
import { getGroups } from '@shared/Firebase/group'
import type { SelectProps } from 'antd/es/select'
import { keyBy } from 'lodash'
import { useTranslation } from 'next-i18next'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import SelectResult from './SelectResult'

type OptionType<T> = {
  data: T
  value: string
  label: string
}

interface Props extends SelectProps {
  value?: Group
  onChange?: (value?: string[]) => void
}

const GroupInput: FC<Props> = (props) => {
  const { onChange, value: initValue } = props

  const { t } = useTranslation()

  const transformOptions = useCallback((options: Group[]) => {
    return options.map((item) => ({
      value: item.id!,
      label: item.name!,
      data: item,
    }))
  }, [])

  const [values, setValues] = useState<OptionType<Group>[]>(
    transformOptions(initValue ? [initValue] : [])
  )
  const [valuesOptions, setValuesOptions] = useState<
    OptionType<Group>[] | undefined
  >()
  const valuesMap = useMemo(() => keyBy(values, 'value'), [values])

  const fetchDataList = useCallback(
    async (searchText: string): Promise<Group[]> => {
      const limit = 4
      const searchData = await getGroups({
        searchText,
        limit: !searchText ? limit : 999999,
        page: 1,
        orders: [
          {
            key: 'member',
            order: 'desc',
          },
        ],
      })
      return !searchText
        ? searchData.data[0]?.data.slice(0, limit).filter((item) => !!item.id)
        : searchData.data[0]?.data.filter((item) => !!item.id)
    },
    []
  )

  const onOptionsChange = useCallback(
    (newOptions: Group[]) => {
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
    },
    [transformOptions, valuesOptions]
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

  useEffect(() => {
    let ids = values?.map((item) => item.data?.id)
    onChange?.(ids)
  }, [values])

  return (
    <div className={props.className}>
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
        selectTitle={t('plan.select-a-group')}
        searchResult={valuesOptions
          ?.filter((item) => !valuesMap[item.value])
          .map((item) => ({
            label: item.data.name!,
            value: item.data.id!,
            avatar: item.data.image!,
          }))}
        onClickItem={onClickItem}
        searchingTitle={t('group.keep-typing-to-invite')}
      />
    </div>
  )
}

export default GroupInput
