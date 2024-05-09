import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import WelcomeDashboard from '@assets/images/WelcomeDashboard.png'
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

export type TourWelcomeModalRef = {
  show: () => void
}

const TourWelcomeModal: ForwardRefRenderFunction<TourWelcomeModalRef, Props> = (
  {},
  ref
) => {
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
    updateDashboardOnboarding({ welcome: true })
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
          {t('welcome-to-dashboard-title')}
        </H5>
        <Image
          src={WelcomeDashboard}
          alt="welcome-image"
          className="bg-none"
          objectFit="contain"
        />
        <Text className="mt-3 text-center text-neutral-80">
          {t('welcome-dashboard-description')}
        </Text>
        <div className="flex items-center justify-center">
          <Button
            className="mt-10 w-full sm:w-1/3"
            type="primary"
            onClick={() => {
              updateDashboardOnboarding({ welcome: true })
              router.push('/groups')
            }}
          >
            {t('go-to-group-page')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(TourWelcomeModal)
