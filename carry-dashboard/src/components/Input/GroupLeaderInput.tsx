import Tag from '@components/Tag'
import { useAppSelector } from '@redux/hooks'
import { getMembers } from '@shared/Firebase/member'
import { message, Select, Spin } from 'antd'
import type { SelectProps } from 'antd/es/select'
import { debounce } from 'lodash'
import React, {
  useMemo,
  useRef,
  useState,
  FC,
  useCallback,
  useEffect,
} from 'react'
import SelectResult from './SelectResult'
import { useTranslation } from 'next-i18next'

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
      className="small-selector"
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
  userData?: UserValue[]
}

interface Props extends SelectProps {
  deaultUser?: LeaderSelectedValue
  onChange?: (value: LeaderSelectedValue) => void
  limit?: number
}

const GroupLeaderInput: FC<Props> = (props) => {
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
    userData?: UserValue[]
  }) => {
    props.onChange?.({ ...changedValue })
  }

  useEffect(() => {
    if (props.deaultUser) {
      setValue(props.deaultUser.userIds ?? [])
      triggerChange(props.deaultUser)
      setPickedUser(props.deaultUser.userData ?? [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.deaultUser])

  const fetchUserList = useCallback(
    async (key: string): Promise<UserValue[]> => {
      setLoadMembers(true)
      setSearchText(key)

      const membersData = await getMembers({
        search: key,
        scope: 'organisation',
        scopeId: organisation!.id,
        limit: 4,
        page: 1,
      })

      const members = membersData.data.map((m) => ({
        label: m.name,
        value: m.uid,
        email: '', // TODO: lacking
        avatar: m.image,
      }))

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
    if (props.limit) {
      if (value.length >= props.limit) {
        message.error(t('errors.group-only-leader'))
        return
      }
    }

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
      const userData = newPickedUser.filter(
        (u) => !u.email && newValue.includes(u.value)
      )
      triggerChange({ emails, userIds: users, userData })
    }
    setSearchText('')
  }
  const onCloseItem = (item: UserValue) => {
    const newPickedUser = pickedUser.filter((i) => i.value !== item.value)
    const emails = newPickedUser.filter((u) => u.email).map((i) => i.email)
    const users = newPickedUser.filter((u) => !u.email).map((i) => i.value)
    const userData = newPickedUser.filter((u) => !u.email)
    triggerChange({ emails, userIds: users, userData })
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
      />
      {props.limit && value.length >= props.limit ? null : (
        <SelectResult
          selectTitle={t('select-a-person')}
          searchText={searchText}
          searchResult={
            (!loadMembers &&
              focusing &&
              searchResult.filter((i) => !value.includes(i.value))) ||
            []
          }
          onClickItem={onClickItem}
          searchingTitle={t('group.keep-typing-to-invite')}
        />
      )}
    </div>
  )
}

export default GroupLeaderInput
