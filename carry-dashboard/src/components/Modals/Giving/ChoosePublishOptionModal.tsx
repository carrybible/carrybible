import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import { H1, H5, Text } from '@components/Typography'
import { Avatar, Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onData?: (activity: string) => void
  onClickPublishCampuses: () => void
  onClickPublishGroups: () => void
}

export type ChoosePublishOptionModalRef = {
  show: () => void
  hide: () => void
}

type ChooseItemProps = {
  icon?: string
  iconImage?: string
  title: string
  description: string
  onClick: () => void
}

const ChooseItem: FC<ChooseItemProps> = (props) => {
  return (
    <div
      onClick={props.onClick}
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50 hover:cursor-pointer',
        'flex flex-row items-center',
        'mx-2 my-2 px-6 py-4',
        ' bg-neutral-10'
      )}
    >
      <div className="mr-8 flex min-w-[56px] justify-center">
        {props?.icon ? (
          <H1 className="mr-3 mb-0">{props.icon}</H1>
        ) : (
          <Avatar src={props.iconImage || ''} alt="icon-image" size={56} />
        )}
      </div>
      <div className={classNames('flex flex-col')}>
        <Text strong>{props.title}</Text>
        <Text className="text-neutral-80">{props.description}</Text>
      </div>
    </div>
  )
}

const ChoosePublishOptionModal: ForwardRefRenderFunction<
  ChoosePublishOptionModalRef,
  Props
> = ({ onData, onClickPublishCampuses, onClickPublishGroups }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const show = () => {
    setIsModalVisible(true)
  }

  const hide = () => {
    setIsModalVisible(false)
  }

  useImperativeHandle(ref, () => ({
    show,
    hide,
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
  }

  const onFinish = async (values: { activity: string }) => {
    onData?.(values.activity)
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
        <H5>{t('giving.publish-campaign-option-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item>
            <ChooseItem
              onClick={onClickPublishCampuses}
              icon={t('giving.publish-campuses-icon')}
              title={t('giving.publish-campuses-option')}
              description={t('giving.publish-campuses-description')}
            />
          </Form.Item>

          <Form.Item>
            <ChooseItem
              onClick={onClickPublishGroups}
              icon={t('giving.publish-groups-icon')}
              title={t('giving.publish-groups-option')}
              description={t('giving.publish-groups-description')}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(ChoosePublishOptionModal)
