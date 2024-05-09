import { Text } from '@components/Typography'
import classNames from 'classnames'
import React from 'react'
import Pencil from '@assets/icons/Pencil.svg'
import EditIcon from '@assets/icons/Edit.svg'
import SettingIcon from '@assets/icons/Setting.svg'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { LogoutButton } from './LogoutButton'

const UserInfoPopup: React.FC<{
  onClickEditProfile: () => void
  changeOrganisation: () => void
  onUpdateOrganisation: () => void
  isGM?: boolean
  isOrganisationOwner?: boolean
}> = ({
  onClickEditProfile,
  onUpdateOrganisation,
  changeOrganisation,
  isGM,
  isOrganisationOwner,
}) => {
  const { t } = useTranslation()
  return (
    <div
      className={classNames(
        'flex flex-col  gap-2.5',
        'mb-25 py-3 px-7',
        'rounded-2xl border-2 border-solid border-neutral-50 bg-neutral-10'
      )}
    >
      {isGM ? (
        <div
          className={classNames('flex items-center')}
          onClick={changeOrganisation}
        >
          <Image src={SettingIcon} alt="Setting" />
          <Text className="ml-2">{t('set-default-organisation')}</Text>
        </div>
      ) : null}
      <div
        className={classNames('flex items-center')}
        onClick={onClickEditProfile}
      >
        <Image src={Pencil} alt="Pencil" />
        <Text className="ml-2">{t('members.edit-profile-details')}</Text>
      </div>
      {(isOrganisationOwner || isGM) && (
        <div
          className={classNames('flex items-center')}
          onClick={onUpdateOrganisation}
        >
          <Image src={EditIcon} alt="EditIcon" />
          <Text className="ml-2">{t('edit-ministry-details')}</Text>
        </div>
      )}
      <div className="hidden sm:flex">
        <LogoutButton />
      </div>
    </div>
  )
}

export default UserInfoPopup
