import Plus from '@assets/icons/Plus.svg'
import GroupEmpty from '@assets/images/GroupEmpty.png'
import HomeEmptyImage from '@assets/images/HomeEmpty.png'
import MemberEmpty from '@assets/images/MemberEmpty.png'
import CampusEmptyImage from '@assets/images/CampusEmpty.png'
import PlanEmptyImage from '@assets/images/PlanEmpty.png'
import TemplateEmptyImage from '@assets/images/TemplateEmpty.png'
import FeaturedEmptyImage from '@assets/images/FeaturedEmpty.png'
import Banner from '@components/Banner'
import GroupCreationModal, {
  GroupCreationModalRef,
} from '@components/Modals/GroupCreationModal'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'

import React, { useRef } from 'react'

export const HomeEmpty: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('home.empty-banner-title')}
      content={t('home.empty-banner-content')}
      image={{
        img: HomeEmptyImage,
        imgAlt: 'HomeEmpty',
        width: 250,
        height: 150,
      }}
    />
  )
}

export const GroupsEmpty: React.FC<{ onClickCreateGroup: () => void }> = ({
  onClickCreateGroup,
}) => {
  const { t } = useTranslation()
  const groupCreationModalRef = useRef<GroupCreationModalRef>(null)

  return (
    <>
      <Banner
        title={t('group.create-first-group')}
        content={t('home.create-first-group-desc')}
        btnTitle={t('group.create-group')}
        btnIcon={
          <div className="mr-1 flex">
            <Image src={Plus} alt="plus-icon" width={15} height={15} />
          </div>
        }
        image={{
          img: GroupEmpty,
          imgAlt: 'GroupEmpty',
          width: 240,
          height: 110,
        }}
        className="mb-6"
        onClick={onClickCreateGroup}
      />
      <GroupCreationModal ref={groupCreationModalRef} />
    </>
  )
}

export const MembersEmpty: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('members.empty-banner-title')}
      content={t('members.empty-banner-content')}
      image={{
        img: MemberEmpty,
        imgAlt: 'MemberEmpty',
        width: 200,
        height: 50,
      }}
    />
  )
}

export const CampusEmpty: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('campuses.create-your-first-campus')}
      content={t('campuses.empty-banner-content')}
      image={{
        img: CampusEmptyImage,
        imgAlt: 'CampusEmpty',
        width: 150,
        height: 130,
      }}
      btnTitle={t('campuses.create-a-campus')}
      btnIcon={
        <div className="mr-1 flex">
          <Image src={Plus} alt="plus-icon" width={15} height={15} />
        </div>
      }
      onClick={onClick}
    />
  )
}

export const PlansEmpty: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('plans.empty-banner-title')}
      content={t('plans.empty-banner-content')}
      image={{
        img: PlanEmptyImage,
        imgAlt: 'PlanEmptyImage',
        width: 161,
        height: 149,
      }}
      btnTitle={t('plans.create-plan')}
      onClick={onClick}
    />
  )
}

export const TemplatesEmpty: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('plans.templates.empty-banner-title')}
      content={t('plans.templates.empty-banner-content')}
      image={{
        img: TemplateEmptyImage,
        imgAlt: 'TemplateEmptyImage',
        width: 168,
        height: 180,
      }}
    />
  )
}

export const FeaturedEmpty: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('plans.featured.empty-banner-title')}
      content={t('plans.featured.empty-banner-content')}
      image={{
        img: FeaturedEmptyImage,
        imgAlt: 'FeaturedEmptyImage',
        width: 366,
        height: 218,
      }}
    />
  )
}

export const CampaignEmpty: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('giving.campaign-empty-banner-title')}
      content={t('giving.campaign-empty-banner-content')}
      image={{
        img: CampusEmptyImage,
        imgAlt: 'GivingEmptyImage',
        width: 180,
        height: 156,
      }}
      btnIcon={
        <div className="mr-1 flex">
          <Image src={Plus} alt="plus-icon" width={15} height={15} />
        </div>
      }
      btnTitle={t('giving.create-campaign')}
      onClick={onClick}
    />
  )
}

export const TithingEmpty: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  const { t } = useTranslation()
  return (
    <Banner
      title={t('giving.empty-banner-title')}
      content={t('giving.empty-banner-content')}
      image={{
        img: CampusEmptyImage,
        imgAlt: 'GivingEmptyImage',
        width: 180,
        height: 156,
      }}
      btnIcon={
        <div className="mr-1 flex">
          <Image src={Plus} alt="plus-icon" width={15} height={15} />
        </div>
      }
      btnTitle={t('giving.create-fund')}
      onClick={onClick}
    />
  )
}
