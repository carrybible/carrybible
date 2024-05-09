import Tag from '@components/Tag'
import { SmallText } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { findMembers } from '@shared/Firebase/member'
import { Select, Spin } from 'antd'
import type { SelectProps } from 'antd/es/select'
import { debounce } from 'lodash'
import { useTranslation } from 'next-i18next'
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import SelectResult from './SelectResult'

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  fetchOptions: (search: string) => Promise<ValueType[]>
  debounceTimeout?: number
}

function DebounceSelect<
  ValueType extends {
    key?: string
    label: React.ReactNode
    value: string | number
    email: string
    avatar: string
  } = any
>({
  fetchOptions,
  debounceTimeout = 800,
  ...props
}: DebounceSelectProps<ValueType>) {
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState<ValueType[]>([])
  const fetchRef = useRef(0)

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
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
}

export interface UserValue {
  label: string
  value: string
  email: string
  avatar: string
}

export type LeaderSelectedValue = {
  emails?: string[]
  userIds?: string[]
}

interface Props extends SelectProps {
  value?: LeaderSelectedValue
  onChange?: (value: LeaderSelectedValue) => void
}

/**
 * TODO: Merge with GroupLeaderInput.tsx
 * This component is the same with GroupLeaderInput.tsx (just different when get data)
 */

const DashboardUserInput: FC<Props> = (props) => {
  const [value, setValue] = useState<string[]>([])
  const [pickedUser, setPickedUser] = useState<UserValue[]>([])
  const [searchText, setSearchText] = useState<string>('')
  const [searchResult, setSearchResult] = useState<UserValue[]>([])
  const organisation = useAppSelector((state) => state.me.organisation)
  const [loadMembers, setLoadMembers] = useState(false)
  const [focusing, setFocusing] = useState(false)
  const { t } = useTranslation()

  const triggerChange = (changedValue: {
    emails?: string[]
    userIds?: string[]
  }) => {
    props.onChange?.({ ...changedValue })
  }

  const fetchUserList = useCallback(
    async (key: string): Promise<UserValue[]> => {
      setLoadMembers(true)
      setSearchText(key)

      const membersData = await findMembers({
        searchText: key,
        ignoreExistUser: true,
      })

      const members = membersData.map((m) => ({
        label: m.name,
        value: m.uid,
        email: '', // TODO: lacking
        avatar: m.image,
      })) as UserValue[]

      setSearchResult(members)
      setLoadMembers(false)
      return members
    },
    [organisation]
  )

  useEffect(() => {
    fetchUserList('')
  }, [fetchUserList])

  const onClickItem = (item: UserValue) => {
    if (!value.includes(item.value)) {
      const newValue = value.concat([item.value as any])
      setValue(newValue)
      const newPickedUser = pickedUser.concat([item])
      setPickedUser(newPickedUser)

      const emails = newPickedUser
        .filter((u) => u.email && newValue.includes(u.value))
        .map((i) => i.email)
      const users = newPickedUser
        .filter((u) => !u.email && newValue.includes(u.value))
        .map((i) => i.value)
      triggerChange({ emails, userIds: users })
    }
    setSearchText('')
  }
  const onCloseItem = (item: UserValue) => {
    const newPickedUser = pickedUser.filter((i) => i.value !== item.value)
    const emails = newPickedUser.filter((u) => u.email).map((i) => i.email)
    const users = newPickedUser.filter((u) => !u.email).map((i) => i.value)
    triggerChange({ emails, userIds: users })
    setPickedUser(newPickedUser)
    setValue((v) => v.filter((i) => item.value !== i))
  }

  return (
    <div>
      <DebounceSelect
        {...props}
        mode="tags"
        tagRender={(props) => (
          <Tag
            {...props}
            option={pickedUser}
            onCloseItem={onCloseItem}
            type="user"
          />
        )}
        value={value}
        fetchOptions={fetchUserList}
        dropdownStyle={{ display: 'none' }}
        maxTagTextLength={30}
        loading={loadMembers}
        autoClearSearchValue={false}
        onFocus={() => setFocusing(true)}
        placeholder={
          <SmallText className="ml-2 text-neutral-70">
            {t('settings.invite-user-placeholder')}
          </SmallText>
        }
      />
      <SelectResult
        selectTitle={t('select-a-person')}
        searchText={searchText}
        searchResult={
          (!loadMembers &&
            focusing &&
            searchResult.filter((i) => !value.includes(i.value))) ||
          []
        }
        isCheckEmail={true}
        onClickItem={onClickItem}
        searchingTitle={t('group.keep-typing-to-invite')}
      />
    </div>
  )
}

export default DashboardUserInput
