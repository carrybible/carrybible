import MemberAvatar from '@components/MemberAvatar'
import { Text } from '@components/Typography'
import { Checkbox as AntdCheckbox, Divider } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { CheckboxValueType } from 'antd/es/checkbox/Group'
import React, { useEffect, useMemo, useState } from 'react'

const CheckboxGroup = AntdCheckbox.Group

export type CheckboxOptionType = {
  key?: string
  label: string
  value: string
  image?: string
}

type Props = {
  selectAllTitle?: string
  options: CheckboxOptionType[]
  onChange?: (value?: CheckboxValueType[]) => void
  defaultCheckedList?: string[] | undefined
  confirmCheckedList?: CheckboxValueType[]
  onConfirmValidateValue?: (data: any) => Promise<boolean> | undefined
}

const Checkbox: React.FC<Props> = (props) => {
  const {
    selectAllTitle = 'Select all',
    options,
    onChange,
    defaultCheckedList,
    confirmCheckedList,
    onConfirmValidateValue,
  } = props
  const [checkedList, setCheckedList] = useState<CheckboxValueType[]>(
    defaultCheckedList || []
  )
  const [indeterminate, setIndeterminate] = useState(false)

  const [checkAll, setCheckAll] = useState(false)
  const defaultChecked = useMemo(
    () => defaultCheckedList || [],
    [defaultCheckedList]
  )

  const onValidateValueChange = async (item: CheckboxValueType) => {
    const exist = confirmCheckedList?.includes(item)
    if (exist && onConfirmValidateValue) {
      const option = options.filter((x) => x.value === item)?.[0]
      const isConfirmed = await onConfirmValidateValue(option)
      return isConfirmed
    }
    return true
  }

  const onChangeItem = async (list: CheckboxValueType[]) => {
    if (list.length > checkedList.length) {
      const valid = await onValidateValueChange(list[list.length - 1])
      if (valid) {
        setCheckedList(list)
      }
    } else {
      setCheckedList(list)
    }
    setIndeterminate(!!list.length && list.length < options.length)
    setCheckAll(list.length === options.length)
  }

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setCheckedList(e.target.checked ? options.map((item) => item.value) : [])
    setIndeterminate(false)
    setCheckAll(e.target.checked)
  }

  useEffect(() => {
    onChange?.(checkedList.sort())
  }, [checkedList, onChange])

  useEffect(() => {
    setCheckedList(defaultChecked)
    const defaultCheckAll =
      defaultChecked.length > 0 &&
      defaultChecked.sort().join() ===
        options
          .sort()
          .map((item) => item.key)
          .join()
    setCheckAll(defaultCheckAll)
    setIndeterminate(
      !!defaultChecked?.length && defaultChecked?.length < options.length
    )
  }, [defaultChecked, options])

  return (
    <>
      <AntdCheckbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
        className="ml-4 flex items-center"
      >
        <div className="pt-1">
          <Text strong className="ml-6">
            {selectAllTitle}
          </Text>
        </div>
      </AntdCheckbox>
      <Divider />
      <CheckboxGroup
        className="flex max-h-64 flex-col overflow-auto"
        value={checkedList}
        onChange={onChangeItem}
      >
        {options.map((item) => (
          <AntdCheckbox
            className="ml-4 flex items-center space-x-6 py-4"
            value={item.value}
            key={item?.value}
          >
            <div className="flex flex-row items-center space-x-6">
              <div>
                <MemberAvatar src={item.image || ''} size={50} />
              </div>
              <div>
                <Text strong>{item.label}</Text>
              </div>
            </div>
          </AntdCheckbox>
        ))}
      </CheckboxGroup>
    </>
  )
}

export default Checkbox
