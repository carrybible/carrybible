import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { Plan } from '@dts/Plans'
import { useAppSelector } from '@redux/hooks'
import { updateOrgPlan } from '@shared/Firebase/plan'
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

type Props = {
  shouldCallApi?: boolean
}

export type EnterPlanDayTitleModalRef = {
  show: (data: { plan: Plan; dayIndex: number }) => Promise<string | undefined>
}

const EnterPlanDayTitleModal: ForwardRefRenderFunction<
  EnterPlanDayTitleModalRef,
  Props
> = ({ shouldCallApi = true }, ref) => {
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [data, setData] = useState<{ plan: Plan; dayIndex: number } | null>(
    null
  )
  const resolveRef = useRef<((updateTitle: string | undefined) => void) | null>(
    null
  )

  useImperativeHandle(ref, () => ({
    show: (editData) => {
      setIsModalVisible(true)
      setData(editData)
      form.setFieldValue(
        'title',
        editData.plan.blocks?.[editData.dayIndex].name
      )
      return new Promise<string | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields([])
    resolveRef.current = null
    setIsModalVisible(false)
    setTimeout(() => setData(null), 200)
  }

  const onFinish = async (values: { title: string }) => {
    if (!data) {
      return
    }
    if (shouldCallApi) {
      setLoading(true)
      const { success, message: errorMessage } = await updateOrgPlan({
        plan: {
          id: data.plan.id,
          blocks: data.plan.blocks.map((block, index) =>
            index === data.dayIndex ? { ...block, name: values.title } : block
          ),
        },
        organisationId: me.organisation.id,
      })
      setLoading(false)
      if (!success) {
        console.error('update plan Error: ', errorMessage)
        message.error(t('error-server'))
        return
      }
      message.success(t('plans.day-saved'))
    }

    resolveRef.current?.(values.title)
    handleCancel()
  }

  if (!data) {
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
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
    >
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5>{t('plans.day-index', { indexValue: data?.dayIndex! + 1 })}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          disabled={loading}
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="title"
            label={<Text strong>{t('plans.day-title')}</Text>}
          >
            <Input placeholder={t('plans.enter-title-of-day')} />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                loading={loading}
                disabled={!form.getFieldValue('title') || loading}
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

export default forwardRef(EnterPlanDayTitleModal)
