import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

import PageLayout from '@components/Layout/PageLayout'
import ChoosePlanOptionModal, {
  ChoosePlanOptionModalRef,
} from '@components/Modals/Plan/ChoosePlanOptionModal'
import CreatePlanModal, {
  PlanCreationModalRef,
} from '@components/Modals/Plan/CreatePlanModal'
import EnterCampusModal, {
  EnterCampusModalRef,
} from '@components/Modals/Plan/EnterCampusModal'
import EnterDaysPlanModal, {
  EnterDaysPlanModalRef,
} from '@components/Modals/Plan/EnterDaysPlanModal'
import PlansHeader from '@components/Pages/Plans/PlansHeader'
import PlanTable from '@components/Table/PlanTable'
import Tabs, { TabPane } from '@components/Tabs'
import { Plan } from '@dts/Plans'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { getPlans } from '@shared/Firebase/plan'
import { withTrans } from '@shared/I18n'
import {
  FeaturedEmpty,
  PlansEmpty,
  TemplatesEmpty,
} from '@components/EmptyStates'
import { startLoading, stopLoading } from '@redux/slices/app'
import { H4 } from '@components/Typography'
import { PLAN_TYPE_TABLE } from '@shared/Constants'
import AddSermonLinkModal, {
  AddSermonLinkModalRef,
} from '@components/Modals/Plan/AddSermonLinkModal'
import useOrganisationInfo from '@hooks/useOrganisationInfo'

const PlansPage: NextPageWithLayout = () => {
  const { organisationInfo } = useOrganisationInfo()
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const [haveTemplate, setHaveTemplate] = useState(false)
  const [tab, setTab] = useState({
    plans: '',
    templates: '',
    featured: '',
  })
  const [emptyState, setEmptyState] = useState({
    isFirstTimeLoaded: false,
    plans: false,
  })
  const [plans, setPlans] = useState<Plan[]>([])
  const me = useAppSelector((state) => state.me)
  const [filterCampus, setFilterCampus] = useState('')
  const [header, setHeader] = useState<string>(t('plans.plans-header'))
  const showTabs = ['owner', 'admin'].includes(me.organisation.role ?? '')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const activeTab = router.query.tab as string | undefined

  const setActiveTab = (key: string) => {
    if (key === 'templates') {
      setFilterCampus(tab.templates)
      setHeader(t('plans.templates-header'))
    }
    if (key === 'featured') {
      setFilterCampus(tab.featured)
      setHeader(t('plans.featured-header'))
    }
    if (key === 'plans') {
      setFilterCampus(tab.plans)
      setHeader(t('plans.plans-header'))
    }
    router.replace(
      {
        query: {
          ...router.query,
          tab: key,
        },
      },
      undefined,
      {
        shallow: true,
      }
    )
  }

  const fetchData = useCallback(
    async (campusId?: string, search?: string, tab?: string) => {
      setLoading(true)
      const response = await getPlans({
        campusId: campusId,
        search: search,
        tab: tab ?? 'plans',
      })
      setPlans(response.data)
      setHaveTemplate(response.haveTemplate ?? false)
      setEmptyState((_emptyState) => {
        const updateEmptyState = {
          plans: _emptyState?.plans || response?.data?.length > 0,
        }
        return { isFirstTimeLoaded: true, ...updateEmptyState }
      })
      setLoading(false)
    },
    [filterCampus, searchText, activeTab]
  )

  useEffect(() => {
    if (emptyState.isFirstTimeLoaded) {
      if (showTabs) {
        setActiveTab('plans')
      } else {
        fetchData(filterCampus, searchText, 'plans')
      }
    }
  }, [showTabs])

  useEffect(() => {
    fetchData(filterCampus, '', activeTab)
    setSearchText('')
  }, [activeTab])

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  const onChangeTab = (key: string) => {
    if (key !== activeTab) {
      setActiveTab(key)
    }
  }

  const handleSearch = () => {
    fetchData(filterCampus, searchText, activeTab)
  }
  const onFilterCampus = (campusId: string) => {
    if (activeTab === 'templates') {
      tab.templates = campusId
      setTab(tab)
    }
    if (activeTab === 'featured') {
      tab.featured = campusId
      setTab(tab)
    }
    if (activeTab === 'plans') {
      tab.plans = campusId
      setTab(tab)
    }
    if (campusId !== filterCampus) {
      setFilterCampus(campusId)
      fetchData(campusId, searchText, activeTab)
    }
  }
  const createPlanModalRef = useRef<PlanCreationModalRef>(null)
  const addSermonLinkModalRef = useRef<AddSermonLinkModalRef>(null)
  const enterDaysPlanModalRef = useRef<EnterDaysPlanModalRef>(null)
  const choosePlanOptionModalRef = useRef<ChoosePlanOptionModalRef>(null)
  const enterCampusModalRef = useRef<EnterCampusModalRef>(null)

  const handleChangeSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setSearchText(e.target.value)
    },
    []
  )

  const onTableUpdated = () => {
    fetchData(filterCampus, searchText, activeTab)
  }

  const onClickCreatePlan = useCallback(() => {
    if (haveTemplate || organisationInfo?.enableGeneratePlanFromSermon) {
      choosePlanOptionModalRef.current?.show()
    } else {
      createPlanModalRef.current?.show()
    }
  }, [haveTemplate, organisationInfo?.enableGeneratePlanFromSermon])

  const onClickBuildYourOwn = useCallback(() => {
    choosePlanOptionModalRef.current?.hide()
    createPlanModalRef.current?.show()
  }, [])

  const onClickUseTemplate = useCallback(() => {
    choosePlanOptionModalRef.current?.hide()
    router.push('/plans/template')
  }, [router])

  const onClickGeneratePlanFromSermon = useCallback(() => {
    choosePlanOptionModalRef.current?.hide()
    addSermonLinkModalRef.current?.show()
  }, [])

  return (
    <PageLayout routeChangeLoading title={t('plans.plans-title')}>
      {showTabs ? (
        <Tabs activeKey={activeTab} onChange={onChangeTab}>
          <TabPane tab={t('plans.plans-tab')} key="plans">
            <H4 className="mt-6">{header}</H4>

            {emptyState.isFirstTimeLoaded && !emptyState.plans ? (
              <PlansEmpty onClick={onClickCreatePlan} />
            ) : (
              <>
                <PlansHeader
                  onSearchChange={handleChangeSearch}
                  handleSearch={handleSearch}
                  searchText={searchText}
                  onCreatePlanClick={onClickCreatePlan}
                  className="mt-4"
                  onFilterCampus={onFilterCampus}
                />

                <PlanTable
                  data={plans ?? []}
                  className="mt-10"
                  onTableUpdated={onTableUpdated}
                  planType={PLAN_TYPE_TABLE.ALL}
                />
              </>
            )}
          </TabPane>
          <TabPane tab={t('plans.templates-tab')} key="templates">
            <H4 className="mt-6">{header}</H4>
            {emptyState.isFirstTimeLoaded && !emptyState.plans ? (
              <TemplatesEmpty />
            ) : (
              <>
                <PlansHeader
                  onSearchChange={handleChangeSearch}
                  handleSearch={handleSearch}
                  searchText={searchText}
                  onCreatePlanClick={onClickCreatePlan}
                  className="mt-4"
                  onFilterCampus={onFilterCampus}
                />
                <PlanTable
                  data={plans ?? []}
                  className="mt-10"
                  onTableUpdated={onTableUpdated}
                  planType={PLAN_TYPE_TABLE.TEMPLATE}
                />
              </>
            )}
          </TabPane>
          <TabPane tab={t('plans.featured-tab')} key="featured">
            <H4 className="mt-6">{header}</H4>
            {emptyState.isFirstTimeLoaded && !emptyState.plans ? (
              <FeaturedEmpty />
            ) : (
              <>
                <PlansHeader
                  onSearchChange={handleChangeSearch}
                  handleSearch={handleSearch}
                  searchText={searchText}
                  onCreatePlanClick={onClickCreatePlan}
                  className="mt-4"
                  onFilterCampus={onFilterCampus}
                />
                <PlanTable
                  data={plans ?? []}
                  className="mt-10"
                  onTableUpdated={onTableUpdated}
                  planType={PLAN_TYPE_TABLE.FEATURE}
                />
              </>
            )}
          </TabPane>
        </Tabs>
      ) : (
        <>
          <PlansHeader
            onSearchChange={handleChangeSearch}
            handleSearch={handleSearch}
            searchText={searchText}
            onCreatePlanClick={onClickCreatePlan}
            className="mt-4"
            onFilterCampus={onFilterCampus}
          />

          <PlanTable
            data={plans ?? []}
            className="mt-10"
            onTableUpdated={onTableUpdated}
          />
        </>
      )}
      <CreatePlanModal
        ref={createPlanModalRef}
        onEnterDuration={enterDaysPlanModalRef.current?.show!}
        onEnterCampus={enterCampusModalRef.current?.show!}
      />
      <AddSermonLinkModal ref={addSermonLinkModalRef} />
      <EnterDaysPlanModal ref={enterDaysPlanModalRef} />
      <EnterCampusModal ref={enterCampusModalRef} />
      <ChoosePlanOptionModal
        ref={choosePlanOptionModalRef}
        onClickBuildOwnPlan={onClickBuildYourOwn}
        onClickUseTemplate={onClickUseTemplate}
        onClickGeneratePlanFromSermon={onClickGeneratePlanFromSermon}
        isChooseTemplate={haveTemplate}
      />
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default PlansPage
