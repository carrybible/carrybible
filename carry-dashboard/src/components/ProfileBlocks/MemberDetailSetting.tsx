import Pencil from '@assets/icons/Pencil.svg'
import Delete from '@assets/icons/Delete.svg'
import Eye from '@assets/icons/Eye.svg'
import ProfileBlock from '@components/ProfileBlocks/ProfileBlock'
import { H5, Text } from '@components/Typography'
import { MemberDataType, MemberProfileType } from '@shared/Firebase/member'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { FC, useMemo } from 'react'
import Permissions from '@shared/Permissions'
import { useAppSelector } from '@redux/hooks'
import { User } from '@dts/User'

type Props = {
  userInfo: MemberProfileType
  onPressDetail?: () => void
  handleOnRemoveAccess?: (userInfo: MemberDataType) => void
  handleChangeRole?: () => void
}

const MemberDetailSetting: FC<Props> = ({
  userInfo,
  onPressDetail,
  handleOnRemoveAccess,
  handleChangeRole,
}) => {
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me) as User

  const onClickButtonMore = (e: any) => {
    switch (e.key) {
      case 'view':
        onPressDetail?.()
        break
      case 'remove':
        handleOnRemoveAccess?.(userInfo)
        break
      case 'changerole':
        handleChangeRole?.()
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

    actions.push({
      key: 'view',
      label: t('members.view-profile'),
      icon: <Image src={Eye} alt="view-icon" />,
    })
    if (
      userInfo.uid !== me?.uid &&
      userInfo.permissions?.includes(Permissions.EDIT_PROFILE)
    ) {
      if (
        !(
          userInfo.organisation?.role === 'admin' &&
          me.organisation.role !== 'owner'
        )
      ) {
        actions.push({
          key: 'changerole',
          label: t('members.assign-role'),
          icon: <Image src={Pencil} alt="edit-icon" />,
        })
      }
    }

    if (
      userInfo.uid !== me?.uid &&
      userInfo.permissions?.includes(Permissions.REMOVE_MEMBER)
    ) {
      if (
        !(
          userInfo.organisation?.role === 'admin' &&
          me.organisation.role !== 'owner'
        )
      ) {
        actions.push({
          key: 'remove',
          label: t('members.remove-acess-member'),
          icon: (
            <Image src={Delete} className="text-warning" alt="delete-icon" />
          ),
        })
      }
    }

    return actions
  }, [t, userInfo.permissions])

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

export default MemberDetailSetting
