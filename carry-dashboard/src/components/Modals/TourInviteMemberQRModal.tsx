import { H5, Text } from '@components/Typography'
import {
  generateInviteLink,
  generateInviteQrCode,
  getGroupDetails,
} from '@shared/Firebase/group'
import { message, Modal, Spin } from 'antd'
import React, {
  ForwardRefRenderFunction,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Image from 'next/image'
import QRCodeDefault from '@assets/images/QRCode.png'
import classNames from 'classnames'
import Button from '@components/Button'
import DownloadSimple from '@assets/icons/DownloadSimpleWhite.svg'
import { useTranslation } from 'next-i18next'
import { formatInviteCode } from '@shared/Utils'
import { User } from '@dts/User'
import { updateDashboardOnboarding } from '@shared/Firebase/account'

type Props = {
  me: User
}

export type TourInviteMemberQRModalRef = {
  show: (groupId?: string) => void
}

const TourInviteMemberQRModal: ForwardRefRenderFunction<
  TourInviteMemberQRModalRef,
  Props
> = ({ me }, ref) => {
  const { t } = useTranslation()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [inviteCode, setInviteCode] = useState<string>('')
  const groupId = useRef('')

  const getGroupDetail = async () => {
    try {
      if (me?.groups?.[0]) {
        const { success, data } = await getGroupDetails({
          groupId: groupId.current || me?.groups?.[0],
        })

        if (success && data) {
          setInviteCode(data?.inviteCode)
        }
      }
    } catch (error) {}
  }

  useEffect(() => {
    const run = async () => {
      if (isModalVisible && me?.groups?.[0]) {
        const inviteResult = await generateInviteLink(
          groupId.current || me?.groups?.[0],
          me?.organisation.id
        )
        if (!inviteResult) {
          message.error(t('group.failed-to-generate-invite-link'))
          return
        }
        const { inviteId } = inviteResult
        const { success, data, errorMessage } = await generateInviteQrCode(
          inviteId,
          me?.organisation.id
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
    getGroupDetail()
    run()
  }, [me, isModalVisible, t])

  const handleOk = () => {
    setIsModalVisible(false)
  }

  const show = (id?: string) => {
    groupId.current = id || ''
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    updateDashboardOnboarding({ planPublished: true })
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
        <H5 strong className="text-primary">
          {!qrCodeImage
            ? t('group.qr-code-generating')
            : t('tour-invite-member-qr-title')}
        </H5>
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
        <Text strong className="mt-6">
          {t('group.invite-code')}
        </Text>
        <Text className="mt-1.5 text-primary" strong>
          {formatInviteCode(inviteCode)}
        </Text>
        {qrCodeImage && (
          <Text className="mt-3 px-10 text-center text-neutral-80">
            {t('tour-invite-member-qr-description')}
          </Text>
        )}

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

export default forwardRef(TourInviteMemberQRModal)
