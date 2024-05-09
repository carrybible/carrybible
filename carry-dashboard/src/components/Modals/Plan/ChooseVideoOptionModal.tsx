import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import YoutubeLogo from '@assets/icons/YoutubeLogo.svg'
import Button from '@components/Button'
import { H1, H5, Text } from '@components/Typography'
import { Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {}

export type ChooseVideoOptionModalRef = {
  show: () => Promise<'youtube' | 'web' | undefined>
}

type ChooseItemProps = {
  icon?: string
  iconImage?: string
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}

const ChooseItem: FC<ChooseItemProps> = (props) => {
  return (
    <Button
      type="secondary"
      className={classNames('mx-2 my-2 px-6 py-6 hover:!border-primary')}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <div className="flex w-full whitespace-normal">
        <div className="mr-3 flex min-w-[56px] justify-center">
          {props?.icon ? (
            <H1 className="mr-3 mb-0">{props.icon}</H1>
          ) : (
            <Image
              src={props.iconImage || ''}
              alt="icon-image"
              height={56}
              width={56}
            />
          )}
        </div>
        <div className={classNames('flex flex-1 flex-col')}>
          <Text strong>{props.title}</Text>
          <Text className="text-neutral-80">{props.description}</Text>
        </div>
      </div>
    </Button>
  )
}

const ChooseVideoOptionModal: ForwardRefRenderFunction<
  ChooseVideoOptionModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const resolveRef = useRef<((act?: 'youtube' | 'web') => void) | null>(null)

  const { t } = useTranslation()
  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<'youtube' | 'web' | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onSelect = async (type: 'youtube' | 'web') => {
    resolveRef.current?.(type)
    handleCancel()
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
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5>{t('plans.choose-video-option-title')}</H5>
        <div className="flex w-full flex-col space-y-4">
          <ChooseItem
            icon="🎥"
            title={t('plans.upload-own-video')}
            description={t('plans.upload-own-video-description')}
            onClick={() => onSelect('web')}
          />
          <ChooseItem
            iconImage={YoutubeLogo}
            title={t('plans.use-youtube-video')}
            description={t('plans.use-youtube-video-description')}
            onClick={() => onSelect('youtube')}
          />
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(ChooseVideoOptionModal)
