import Pencil from '@assets/icons/Pencil.svg'
import ProfileBlock from '@components/ProfileBlocks/ProfileBlock'
import { H5, Text } from '@components/Typography'
import Firebase from '@shared/Firebase'
import { MemberProfileType } from '@shared/Firebase/member'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { FC, useMemo } from 'react'

type Props = {
  userInfo: MemberProfileType
  onPressEdit?: () => void
}

const MemberInfo: FC<Props> = ({ userInfo, onPressEdit }) => {
  const { t } = useTranslation()

  const onClickButtonMore = (e: any) => {
    switch (e.key) {
      case 'edit':
        onPressEdit?.()
        break
      default:
        break
    }
  }

  const infoBlocks = [
    <div key={1} className="flex flex-1 flex-col">
      <H5>{t('members.email-address')}</H5>
      <Text className="text-neutral-80">{userInfo.email}</Text>
    </div>,
    <div key={2} className="flex flex-1 flex-col">
      <H5>{t('members.phone-number')}</H5>
      <Text className="text-neutral-80">{userInfo.phoneNumber}</Text>
    </div>,
    <div key={3} className="flex flex-1 flex-col">
      <H5>{t('campuses.campus')}</H5>
      <Text className="text-neutral-80">
        {userInfo.organisation.campus?.name ?? t('members.no-campus')}
      </Text>
    </div>,
  ]

  const buttonMoreData = useMemo(() => {
    const actions: {
      key: string
      label: string
      icon: React.ReactNode
    }[] = []

    if (userInfo.uid === Firebase.auth.currentUser?.uid) {
      actions.push({
        key: 'edit',
        label: t('members.edit-profile'),
        icon: <Image src={Pencil} alt="edit-icon" />,
      })
    }

    return actions
  }, [t, userInfo.uid])

  return (
    <>
      <ProfileBlock
        avatar={userInfo.image}
        name={userInfo.name}
        description={userInfo.address}
        columns={infoBlocks}
        buttonMore={{
          data: buttonMoreData,
          onClick: onClickButtonMore,
        }}
      />
    </>
  )
}

export default MemberInfo
