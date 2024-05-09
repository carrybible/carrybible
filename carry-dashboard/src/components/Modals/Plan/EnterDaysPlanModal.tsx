import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import InputNumber from '@components/Input/InputNumber'
import { H5 } from '@components/Typography'
import { Form, message, Modal } from 'antd'
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

export type EnterDaysPlanModalRef = {
  show: () => Promise<number | undefined>
}

const EnterDaysPlanModal: ForwardRefRenderFunction<
  EnterDaysPlanModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((days: number | undefined) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<number | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    resolveRef.current?.(undefined)
    resolveRef.current = null
    setIsModalVisible(false)
  }

  const onFinish = async (values: { planDays: number }) => {
    resolveRef.current?.(values.planDays)
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
        <H5>{t('plans.amount-of-days-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item name="planDays">
            <InputNumber
              min={1}
              onChange={(value) => {
                if (!value) return
                if (value > 60) {
                  message.error(t('plans.over-max-plan-days'))
                  form.setFieldValue('planDays', 60)
                } else {
                  form.setFieldValue('planDays', value)
                }
              }}
              placeholder={t('plans.enter-amount-of-days')}
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                disabled={!form.getFieldValue('planDays')}
                className="w-1/2"
                type="primary"
                htmlType="submit"
              >
                {t('continue')}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(EnterDaysPlanModal)
