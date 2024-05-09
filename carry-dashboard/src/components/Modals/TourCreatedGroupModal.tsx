import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import AnnouncementImage from '@assets/images/AnnouncementImage.png'
import Button from '@components/Button'
import { H5, Text } from '@components/Typography'
import { updateDashboardOnboarding } from '@shared/Firebase/account'
import { Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {}

export type TourCreatedGroupModalRef = {
  show: () => void
}

const TourCreatedGroupModal: ForwardRefRenderFunction<
  TourCreatedGroupModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { t } = useTranslation()
  const router = useRouter()

  const show = () => {
    setIsModalVisible(true)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    updateDashboardOnboarding({ groupCreated: true })
    setIsModalVisible(false)
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
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
    >
      <div className={classNames('flex flex-col', 'py-10')}>
        <H5 className="pb-10 text-center text-primary">
          {t('tour-created-group-title')}
        </H5>
        <Image
          src={AnnouncementImage}
          alt="created-group-image"
          className="bg-none"
          objectFit="contain"
          width={176}
          height={147}
        />
        <Text className="mt-3 px-16 text-center text-neutral-80">
          {t('tour-created-group-description')}
        </Text>
        <div className="flex items-center justify-center">
          <Button
            className="mt-10 w-full sm:w-1/3"
            type="primary"
            onClick={() => {
              updateDashboardOnboarding({ groupCreated: true })
              router.push('/plans')
            }}
          >
            {t('go-to-plan-page')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(TourCreatedGroupModal)
