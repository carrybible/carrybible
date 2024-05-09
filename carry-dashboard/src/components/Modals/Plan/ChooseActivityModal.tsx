import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import BorderButton from '@components/Button/BorderButton'
import { H5 } from '@components/Typography'
import { GroupActionsType } from '@dts/GroupActions'
import { Activity } from '@dts/Plans'
import { getActTypeIcon, getActTypeText } from '@shared/Utils'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

const DEFAULT_ACTIVITIES: {
  actType: Activity['type']
  subActType?: GroupActionsType
}[] = [
  { actType: 'passage' },
  { actType: 'question' },
  { actType: 'action', subActType: 'prayer' },
  { actType: 'action', subActType: 'gratitude' },
  { actType: 'text' },
  { actType: 'video' },
]

type Props = {
  onData?: (data: {
    actType: Activity['type']
    subActType?: GroupActionsType
  }) => void
}

export type ChooseActivityModalRef = {
  show: () => void
}

const ChooseActivityModal: ForwardRefRenderFunction<
  ChooseActivityModalRef,
  Props
> = ({ onData }, ref) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)

  const show = () => {
    setIsModalVisible(true)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
  }

  const onSelect = async (values: {
    actType: Activity['type']
    subActType?: GroupActionsType
  }) => {
    onData?.({ actType: values.actType, subActType: values.subActType })
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
      className="w-full sm:w-fit"
      centered
      wrapClassName="overflow-scroll no-scrollbar"
    >
      <div className={classNames('items-center', 'flex flex-col', 'py-5')}>
        <H5 className="mb-10">{t('plans.choose-activity-title')}</H5>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {DEFAULT_ACTIVITIES.map(({ actType, subActType }) => (
            <BorderButton
              key={`${actType}-${subActType}`}
              className="flex w-full whitespace-normal sm:w-48"
              shape="default"
              onClick={() => {
                onSelect({ actType, subActType })
              }}
            >
              {getActTypeIcon(actType, subActType)}{' '}
              {t(getActTypeText(actType, subActType))}
            </BorderButton>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(ChooseActivityModal)
