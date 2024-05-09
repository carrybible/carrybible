import { Text } from '@components/Typography'
import {
  generateInviteLink,
  generateInviteQrCode,
} from '@shared/Firebase/group'
import { message, Modal, Spin } from 'antd'
import React, {
  ForwardRefRenderFunction,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Image from 'next/image'
import QRCodeDefault from '@assets/images/QRCode.png'
import classNames from 'classnames'
import Button from '@components/Button'
import DownloadSimple from '@assets/icons/DownloadSimpleWhite.svg'
import { useTranslation } from 'next-i18next'
import { formatInviteCode } from '@shared/Utils'

type Props = {
  groupId: string
  orgId?: string
  inviteCode: string
}

export type InviteMemberQRModalRef = {
  show: () => void
}

const InviteMemberQRModal: ForwardRefRenderFunction<
  InviteMemberQRModalRef,
  Props
> = ({ inviteCode, groupId, orgId }, ref) => {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      if (isModalVisible) {
        const inviteResult = await generateInviteLink(groupId, orgId)
        if (!inviteResult) {
          message.error(t('group.failed-to-generate-invite-link'))
          return
        }
        const { inviteId } = inviteResult
        const { success, data, errorMessage } = await generateInviteQrCode(
          inviteId,
          orgId
        )
        if (!success) {
          console.error('generate QR code Error: ', errorMessage)
          message.error(t('error-server'))
          setIsModalVisible(false)
          return
        }

        const { url: qrCode } = data
        setQrCodeImage(qrCode)
      }
    }
    run()
  }, [groupId, isModalVisible, t])

  const handleOk = () => {
    setIsModalVisible(false)
  }

  const show = () => {
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  useImperativeHandle(ref, () => ({
    handleOk,
    handleCancel,
    show,
  }))

  return (
    <Modal
      closable
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      closeIcon={
        <Image src={XCircleIcon} alt="close-icon" width={22} height={22} />
      }
      footer={null}
      centered
    >
      <div className={classNames('flex flex-col', 'items-center', 'py-10')}>
        <Text strong>
          {!qrCodeImage
            ? t('group.qr-code-generating')
            : t('group.qr-code-ready')}
        </Text>
        <div className="mt-10 h-[164px] w-[164px]">
          <Spin spinning={!qrCodeImage}>
            <Image
              src={qrCodeImage || QRCodeDefault}
              alt="qr-code"
              width={164}
              height={164}
            />
          </Spin>
        </div>
        <Text className="mt-2">{t('group.invite-code')}</Text>
        <Text className="mt-1 text-primary" strong>
          {formatInviteCode(inviteCode)}
        </Text>
        <Button
          className="mt-10 w-1/2"
          download={'qrcode'}
          href={qrCodeImage}
          disabled={!qrCodeImage}
          target="blank"
          icon={
            <Image
              src={DownloadSimple}
              className="text-neutral-10"
              alt="download-simple"
            />
          }
        >
          {t('download')}
        </Button>
      </div>
    </Modal>
  )
}

export default forwardRef(InviteMemberQRModal)
