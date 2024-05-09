import Delete from '@assets/icons/Delete.svg'
import Pencil from '@assets/icons/Pencil.svg'
import Plus from '@assets/icons/Plus.svg'
import Button from '@components/Button'
import ChooseAnInviteOptionModal from '@components/Modals/ChooseAnInviteOptionModal'
import InviteMemberQRModal, {
  InviteMemberQRModalRef,
} from '@components/Modals/InviteMemberQRModal'
import { H5, Text } from '@components/Typography'
import { GroupDetailType } from '@shared/Firebase/group'
import { formatInviteCode } from '@shared/Utils'
import classNames from 'classnames'
import { TFunction, useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { FC, useCallback, useMemo, useRef } from 'react'
import ProfileBlock from './ProfileBlock'

type Props = {
  groupDetail: GroupDetailType
  groupCampus?: string
  onPressDelete?: () => void
  onPressEdit?: () => void
}

const getButtonOptions = (t: TFunction) => [
  {
    label: t('group.edit-group-details'),
    key: 'edit',
    danger: false,
    icon: <Image src={Pencil} alt="edit-icon" />,
  },
  {
    label: t('group.delete-group'),
    key: 'delete',
    danger: true,
    icon: <Image src={Delete} className="text-warning" alt="delete-icon" />,
  },
]

const GroupInfo: FC<Props> = ({
  groupDetail,
  groupCampus,
  onPressEdit,
  onPressDelete,
}) => {
  const { t } = useTranslation()
  const inviteMemberQrModalRef = useRef<InviteMemberQRModalRef>(null)
  const chooseAnInviteOptionModalRef = useRef<any>()

  const onClickInviteOthers = useCallback(() => {
    chooseAnInviteOptionModalRef.current?.show()
    // inviteMemberQrModalRef.current?.show()
  }, [])

  const buttonOptions = getButtonOptions(t)

  const inviteCode = useMemo(() => {
    return formatInviteCode(groupDetail.inviteCode)
  }, [groupDetail.inviteCode])

  const col1 = useMemo(
    () => (
      <div
        key={1}
        className={classNames(
          'w-full sm:w-fit',
          'sm:flex-2 flex flex-grow flex-row justify-between'
        )}
      >
        <div className="flex flex-1 flex-col">
          <H5>{t('group.group-leader')}</H5>
          <Text className="text-neutral-80">{groupDetail.leader?.name}</Text>
        </div>
        <div className="flex flex-1  flex-col">
          <H5>{t('group.invite-code')}</H5>
          <Text strong className="text-primary">
            {inviteCode}
          </Text>
        </div>
      </div>
    ),
    [groupDetail.leader?.name, inviteCode, t]
  )

  const col2 = useMemo(
    () => (
      <div
        key={2}
        className={classNames(
          'flex sm:flex-1',
          'w-full sm:w-fit',
          'justify-end self-center',
          'mt-6 sm:mt-0'
        )}
      >
        <Button
          onClick={onClickInviteOthers}
          icon={<Image src={Plus} alt="plus-icon" />}
          className="w-full sm:w-fit"
        >
          {t('invite-others')}
        </Button>
      </div>
    ),
    [t, onClickInviteOthers]
  )

  const columns = [col1, col2]

  const onClickButtonMore = (e: any) => {
    switch (e.key) {
      case 'edit':
        onPressEdit?.()
        break
      case 'delete':
        onPressDelete?.()
        break
      default:
        break
    }
  }

  return (
    <>
      <ProfileBlock
        avatar={groupDetail.image}
        name={groupDetail.name}
        description={groupCampus}
        columns={columns}
        buttonMore={{ data: buttonOptions, onClick: onClickButtonMore }}
      />
      <ChooseAnInviteOptionModal
        groupId={groupDetail.id}
        orgId={groupDetail.organisation?.id}
        ref={chooseAnInviteOptionModalRef}
        onPressDownload={() => {
          chooseAnInviteOptionModalRef.current?.hide()
          inviteMemberQrModalRef.current?.show()
        }}
      />
      <InviteMemberQRModal
        groupId={groupDetail.id}
        orgId={groupDetail.organisation?.id}
        inviteCode={groupDetail.inviteCode}
        ref={inviteMemberQrModalRef}
      />
    </>
  )
}

export default GroupInfo
