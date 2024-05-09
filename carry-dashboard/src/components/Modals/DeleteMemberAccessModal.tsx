import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { H5, Text } from '@components/Typography'
import { User } from '@dts/User'
import { useAppSelector } from '@redux/hooks'
import { deleteMemberAccess } from '@shared/Firebase/member'
import { Avatar, message, Modal, Spin } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onDeleted?: () => void
}

export type DeleteMemberAccessModalRef = {
  show: (userInfo: {
    userId: string
    userAvatar: string
    userName: string
  }) => void
}

const DeleteMemberAccessModal: ForwardRefRenderFunction<
  DeleteMemberAccessModalRef,
  Props
> = ({ onDeleted }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const me = useAppSelector((state) => state.me) as User
  const [userInfo, setUserInfo] = useState<
    | {
        userId: string
        userAvatar: string
        userName: string
      }
    | undefined
  >()
  const [spinning, setSpinning] = useState(false)
  const { t } = useTranslation()
  const show = (userInfo: {
    userId: string
    userAvatar: string
    userName: string
  }) => {
    setIsModalVisible(true)
    setUserInfo(userInfo)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleDeleteMemberAccess = async () => {
    if (!userInfo) {
      return
    }
    setSpinning(true)
    const isDelete = await deleteMemberAccess(userInfo.userId, me)
    if (isDelete) {
      setIsModalVisible(false)
      onDeleted?.()
      message.success(t('members.remove-success'))
    } else {
      message.error(t('error-server'))
    }
    setSpinning(false)
  }

  if (!userInfo) {
    return null
  }

  return (
    <Modal
      closable
      visible={isModalVisible}
      onCancel={handleCancel}
      closeIcon={
        <Image src={XCircleIcon} alt="close-icon" width={22} height={22} />
      }
      footer={null}
      destroyOnClose
      centered
    >
      <Spin spinning={spinning}>
        <div className={classNames('flex flex-col', 'items-center')}>
          <H5>{t('members.remove-dashboard-access-account')}</H5>
          <Avatar className="mt-10" src={userInfo.userAvatar} size={107} />
          <Text className="mt-3" strong>
            {userInfo.userName}
          </Text>
          <Text className="mt-10 text-center">
            {t('members.remove-dashboard-access-warning-1')}
            <Text strong>{userInfo.userName}</Text>
            {t('members.remove-dashboard-access-warning-2')}
          </Text>
          <Button
            className="mt-10"
            type="danger"
            onClick={handleDeleteMemberAccess}
          >
            {t('members.remove-access-btn')}
          </Button>
        </div>
      </Spin>
    </Modal>
  )
}

export default forwardRef(DeleteMemberAccessModal)
