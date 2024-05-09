import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import BorderButton from '@components/Button/BorderButton'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { QuestionAct } from '@dts/Plans'
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

export type AddQuestionModalRef = {
  show: (initAct?: QuestionAct) => Promise<QuestionAct | undefined>
}

const DEFAULT_QUESTIONS = [
  'What passage stood out to you? 📖',
  'What did you learn about God’s character? ⚡️',
  'How can you apply this to your life? 👟',
  'Who can you share this with? 💬️',
]

const AddQuestionModal: ForwardRefRenderFunction<AddQuestionModalRef, Props> = (
  {},
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const resolveRef = useRef<((act?: QuestionAct) => void) | null>(null)

  const { t } = useTranslation()
  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('question', initAct.question)
      }
      return new Promise<QuestionAct | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onFinish = async (values: { question: string }) => {
    resolveRef.current?.({
      type: 'question',
      question: values.question,
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
        <H5>{t('plans.add-question-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="question"
            label={<Text strong>{t('plans.write-own-question')}</Text>}
          >
            <Input placeholder={t('plans.enter-question')} />
          </Form.Item>
          <Form.Item
            label={<Text strong>{t('plans.choose-question')}</Text>}
            shouldUpdate
            dependencies={['question']}
          >
            {() => (
              <div className="space-y-3">
                {DEFAULT_QUESTIONS.map((item) => (
                  <BorderButton
                    key={item}
                    className="flex w-full"
                    onClick={() => {
                      form.setFieldValue('question', item)
                    }}
                    activated={item === form.getFieldValue('question')}
                  >
                    {item}
                  </BorderButton>
                ))}
              </div>
            )}
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                className="w-1/2"
                type="primary"
                htmlType="submit"
                disabled={!form.getFieldValue('question')}
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

export default forwardRef(AddQuestionModal)
