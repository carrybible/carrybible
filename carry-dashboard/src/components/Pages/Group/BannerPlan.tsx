import GroupPlanImage from '@assets/images/CampusEmpty.png'

import Banner from '@components/Banner'
import { useTranslation } from 'next-i18next'

export const GroupPlanBanner: React.FC<{
  buttonTitle: string
  onClick: () => void
}> = ({ onClick, buttonTitle }) => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('group.plan-banner-title')}
      content={t('group.plan-banner-content')}
      image={{
        img: GroupPlanImage,
        imgAlt: 'GroupPlanImage',
        width: 241.5,
        height: 223.5,
      }}
      btnTitle={buttonTitle}
      onClick={onClick}
    />
  )
}
