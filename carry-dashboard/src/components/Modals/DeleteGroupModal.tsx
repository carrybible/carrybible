import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { H5, Text } from '@components/Typography'
import { deleteGroup } from '@shared/Firebase/group'
import { Avatar, Modal, Spin } from 'antd'
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

export type DeleteGroupModalRef = {
  show: (groupInfo: {
    groupId: string
    groupAvatar: string
    groupName: string
  }) => void
}

const DeleteGroupModal: ForwardRefRenderFunction<DeleteGroupModalRef, Props> = (
  { onDeleted },
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [groupInfo, setGroupInfo] = useState<
    | {
        groupId: string
        groupAvatar: string
        groupName: string
      }
    | undefined
  >()
  const [spinning, setSpinning] = useState(false)
  const { t } = useTranslation()
  const show = (groupInfo: {
    groupId: string
    groupAvatar: string
    groupName: string
  }) => {
    setIsModalVisible(true)
    setGroupInfo(groupInfo)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleDeleteGroup = async () => {
    if (!groupInfo) {
      return
    }
    setSpinning(true)
    const isDelete = await deleteGroup(groupInfo.groupId)
    if (isDelete) {
      setIsModalVisible(false)
      onDeleted?.()
    }
    setSpinning(false)
  }

  if (!groupInfo) {
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
          <H5>{t('group.delete')}</H5>
          <Avatar className="mt-10" src={groupInfo.groupAvatar} size={107} />
          <Text className="mt-3" strong>
            {groupInfo.groupName}
          </Text>
          <Text className="mt-10 text-center">
            {t('group.delete-warning-1')}
            <Text strong>{groupInfo.groupName}</Text>
            {t('group.delete-warning-2')}
          </Text>
          <Button className="mt-10" type="danger" onClick={handleDeleteGroup}>
            {t('group.delete-btn')}
          </Button>
        </div>
      </Spin>
    </Modal>
  )
}

export default forwardRef(DeleteGroupModal)
