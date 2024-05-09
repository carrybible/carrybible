import PreviewTemplates from '@assets/images/PreviewTemplates.png'
import Banner from '@components/Banner'
import PageLayout from '@components/Layout/PageLayout'
import TemplePlanHeader from '@components/Pages/Plans/TemplePlanHeader'
import PlanTemplates from '@components/PlanBuilder/PlanTemplates'
import { Plan } from '@dts/Plans'
import useBreadcrumb from '@hooks/useBreadcrumb'
import useOrganisationInfo from '@hooks/useOrganisationInfo'
import { NextPageWithLayout } from '@pages/_app'
import { getPlans } from '@shared/Firebase/plan'
import { withTrans } from '@shared/I18n'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'

const PlanDayDetail: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const { organisationInfo } = useOrganisationInfo()
  const [searchText, setSearchText] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  // const { plans } = usePlansData({ searchText, useTemplate: true })
  useBreadcrumb({
    label: `${organisationInfo?.name || ''} Templates`,
    previousLabel: t('menu.plans'),
  })

  useEffect(() => {
    fetchData(undefined, searchText, undefined)
  }, [searchText])

  const fetchData = async (
    campusId?: string,
    search?: string,
    tab?: string
  ) => {
    const response = await getPlans({
      campusId: campusId,
      search: search,
      tab: tab ?? 'templates',
    })
    setPlans(response.data)
  }

  const handleChangeSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setSearchText(e.target.value)
    },
    []
  )

  return (
    <PageLayout
      routeChangeLoading
      title={t('plans.template-title', {
        orgName: organisationInfo?.name || '',
      })}
    >
      <TemplePlanHeader
        onSearchChange={handleChangeSearch}
        searchText={searchText}
      />
      <div
        className={classNames(
          'flex flex-row flex-wrap',
          'justify-between',
          'mt-6'
        )}
      >
        <Banner
          className="w-full"
          title={t('plans.preview-templates')}
          content={t('plans.preview-templates-content')}
          image={{
            img: PreviewTemplates,
            imgAlt: 'PreviewTemplates',
            width: 120,
            height: 120,
          }}
        />
      </div>
      <div>
        <PlanTemplates plans={plans} />
      </div>
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default PlanDayDetail
