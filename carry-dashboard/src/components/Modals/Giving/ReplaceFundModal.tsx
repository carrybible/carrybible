import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { H5 } from '@components/Typography'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {}

export type ReplaceFundModalRef = {
  show: (campusName: string) => Promise<boolean>
}

const ReplaceFundModal: ForwardRefRenderFunction<ReplaceFundModalRef, Props> = (
  props,
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((replace: boolean) => void) | null>(null)
  const [campus, setCampus] = useState<string>('')

  useImperativeHandle(ref, () => ({
    show: (campusName: string) => {
      setIsModalVisible(true)
      setCampus(campusName)
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.(false)
  }

  const onFinish = async () => {
    resolveRef.current?.(true)
    form.resetFields()
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
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5 className="text-center">
          {t('giving.replace-confirm-model-title') + ' ' + campus ?? ''}
        </H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <div className="flex flex-col items-center">
            <p style={{ fontSize: 75 }} className="m-0">
              {t('giving.replace-confirm-content')}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-center">{t('giving.replace-confirm-desc')}</p>
          </div>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button className="w-1/2" type="primary" htmlType="submit">
                {t('giving.replace-button')}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(ReplaceFundModal)
