import Pencil from '@assets/icons/Pencil.svg'
import Delete from '@assets/icons/Delete.svg'
import ProfileBlock from '@components/ProfileBlocks/ProfileBlock'
import { H5, Text } from '@components/Typography'
import Firebase from '@shared/Firebase'
import { MemberDataType, MemberProfileType } from '@shared/Firebase/member'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { FC, useMemo } from 'react'
import Permissions from '@shared/Permissions'

type Props = {
  userInfo: MemberProfileType
  onPressEdit?: () => void
  handleOnDelete?: (userInfo: MemberDataType) => void
}

const MemberSettingInfo: FC<Props> = ({
  userInfo,
  onPressEdit,
  handleOnDelete,
}) => {
  const { t } = useTranslation()

  const onClickButtonMore = (e: any) => {
    switch (e.key) {
      case 'edit':
        onPressEdit?.()
        break
      case 'delete':
        handleOnDelete?.(userInfo)
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
      <H5>{t('settings.role')}</H5>
      <Text className="text-neutral-80">
        {userInfo.organisation?.role
          ? userInfo.organisation?.role === 'admin'
            ? userInfo.organisation?.name + ' ' + t('settings.role-admin')
            : userInfo.organisation?.role === 'owner'
            ? userInfo.organisation?.name + ' ' + t('settings.role-owner')
            : userInfo.organisation?.role === 'campus-leader'
            ? t('settings.role-campus-leader')
            : userInfo.organisation?.role === 'campus-user'
            ? t('settings.role-campus-user')
            : t('settings.no-role')
          : t('settings.no-role')}
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
    } else {
      // if (userInfo.permissions?.includes(Permissions.EDIT_PROFILE)) {
      //   actions.push({
      //     key: 'edit',
      //     label: t('members.edit-profile'),
      //     icon: <Image src={Pencil} alt="edit-icon" />,
      //   })
      // }
      if (userInfo.permissions?.includes(Permissions.REMOVE_MEMBER)) {
        actions.push({
          key: 'delete',
          label: t('members.delete-member'),
          icon: (
            <Image src={Delete} className="text-warning" alt="delete-icon" />
          ),
        })
      }
    }

    return actions
  }, [t, userInfo.permissions, userInfo.uid])

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

export default MemberSettingInfo
