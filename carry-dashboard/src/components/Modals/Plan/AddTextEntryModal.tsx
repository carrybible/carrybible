import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Input from '@components/Input'
import TextArea from '@components/Input/TextArea'
import { H5, Text } from '@components/Typography'
import { TextAct } from '@dts/Plans'
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

export type AddTextEntryModalRef = {
  show: (initAct?: TextAct) => Promise<TextAct | undefined>
}

const AddTextEntryModal: ForwardRefRenderFunction<
  AddTextEntryModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((act?: TextAct) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('title', initAct.title)
        form.setFieldValue('textEntry', initAct.content)
      }
      return new Promise<TextAct | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onFinish = async (values: { textEntry: string; title: string }) => {
    resolveRef.current?.({
      type: 'text',
      title: values.title,
      content: values.textEntry,
    })
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
        <H5>{t('plans.add-text-entry-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="title"
            label={<Text strong>{t('plans.text-entry-title')}</Text>}
          >
            <Input placeholder={t('plans.enter-text-entry-title')} />
          </Form.Item>
          <Form.Item
            name="textEntry"
            label={<Text strong>{t('plans.text-entry')}</Text>}
          >
            <TextArea placeholder={t('plans.enter-text-entry')} rows={8} />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                disabled={
                  !form.getFieldValue('textEntry') ||
                  !form.getFieldValue('title')
                }
                className="w-1/2"
                type="primary"
                htmlType="submit"
              >
                {t('done')}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddTextEntryModal)
