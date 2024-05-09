import Downline from '@assets/icons/Downline.svg'
import Plus from '@assets/icons/Plus.svg'
import Button from '@components/Button'
import { GroupsEmpty } from '@components/EmptyStates'
import PageLayout from '@components/Layout/PageLayout'
import GroupCreationModal, {
  GroupCreationModalRef,
} from '@components/Modals/GroupCreationModal'
import TourCreatedGroupModal, {
  TourCreatedGroupModalRef,
} from '@components/Modals/TourCreatedGroupModal'
import SearchBox from '@components/SearchBox'
import Select from '@components/Select'
import GroupTable from '@components/Table/GroupTable'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useDidMountEffect from '@hooks/useDidMountEffect'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { fetchGroups } from '@redux/thunks/group'
import { withTrans } from '@shared/I18n'
import Permissions from '@shared/Permissions'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const GroupsPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const listGroup = useAppSelector((state) => state.group.listGroup)
  const dispatch = useAppDispatch()
  const [groupByValue] = useState('none')
  const [searchText, setSearchText] = useState('')
  const me = useAppSelector((state) => state.me)
  const [filteringCampus, setFilteringCampus] = useState('')
  const [isEmptyGroup, setEmptyGroup] = useState(false)

  const groupCreationModalRef = useRef<GroupCreationModalRef>(null)
  const tourCreatedGroupModalRef = useRef<TourCreatedGroupModalRef>(null)

  const campusOptions = useMemo(() => {
    const data = me?.campusAccess?.map((x: { id: string; name: string }) => ({
      key: x.id,
      label: x.name || x.id,
      value: x.id,
    }))
    if (data?.length && data.length > 1) {
      return [{ key: '1', label: 'All Campuses', value: '' }].concat(
        data as any
      )
    }

    return [{ key: '1', label: 'All Campuses', value: '' }]
  }, [me])

  const getData = useCallback(
    async ({
      text = '',
      forceLoading = false,
    }: { text?: string; forceLoading?: boolean } = {}) => {
      await dispatch(
        fetchGroups({
          searchText: text,
          scope: 'Unknown',
          forceLoading,
          onSuccess: (groupData) => {
            if (!text && groupData?.length === 0) {
              setEmptyGroup(true)
            } else {
              setEmptyGroup(false)
            }
          },
        })
      ).unwrap()
    },
    [dispatch]
  )

  useEffect(() => {
    getData()
    // load data when first init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDidMountEffect(() => {
    getData({ text: searchText, forceLoading: true })
  }, [getData, groupByValue])

  const handleChangeSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setSearchText(e.target.value)
    },
    []
  )

  const handleSearch = useCallback(() => {
    getData({ text: searchText, forceLoading: true })
  }, [getData, searchText])

  const onTableUpdated = () => getData({ text: searchText, forceLoading: true })

  const onClickCreateGroup = useCallback(() => {
    groupCreationModalRef.current?.show()
  }, [])

  return (
    <>
      <PageLayout title={t('group.groups-title')} routeChangeLoading>
        {isEmptyGroup ? (
          <GroupsEmpty onClickCreateGroup={onClickCreateGroup} />
        ) : (
          <>
            <div className="flex flex-col justify-between sm:flex-row">
              <div className={classNames('flex w-full flex-col sm:w-1/2')}>
                <SearchBox
                  placeholder={t('group.search-groups-text')}
                  onChange={handleChangeSearch}
                  onPressEnter={handleSearch}
                  value={searchText}
                  // allowClear
                />
                {campusOptions?.length >= 1 ? (
                  <Select
                    options={campusOptions}
                    placeholder={t('group.group-by')}
                    className="mt-6 w-full sm:w-2/5"
                    value={filteringCampus}
                    onChange={(value) => {
                      setFilteringCampus(value)
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
              </div>
              <div className="flex w-full sm:block sm:w-fit">
                <Button
                  className="mt-6 flex h-fit flex-1 items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
                  icon={
                    <div className="mr-1 flex">
                      <Image
                        src={Plus}
                        alt="plus-icon"
                        width={15}
                        height={15}
                      />
                    </div>
                  }
                  onClick={onClickCreateGroup}
                >
                  {t('group.create-group')}
                </Button>
              </div>
            </div>
            <GroupTable
              dataSource={listGroup && listGroup[0]?.data}
              className="mt-10"
              onTableUpdated={onTableUpdated}
              filterCampusId={filteringCampus}
            />
          </>
        )}
      </PageLayout>
      <GroupCreationModal
        ref={groupCreationModalRef}
        onUpdate={() => getData({ forceLoading: true })}
        onCreate={() =>
          !me?.dashboardOnboarding?.groupCreated &&
          tourCreatedGroupModalRef.current?.show()
        }
      />
      <TourCreatedGroupModal ref={tourCreatedGroupModalRef} />
    </>
  )
}

export const getStaticProps = withTrans()
export default withPagePermissionChecker(GroupsPage, {
  permissionsRequire: [Permissions.VIEW_DASHBOARD_GROUPS],
  noPermissionView: true,
})
