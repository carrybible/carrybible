import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import BorderButton from '@components/Button/BorderButton'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { GroupActionsType } from '@dts/GroupActions'
import { GroupActionAct } from '@dts/Plans'
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

type Props = {
  mode: GroupActionsType
}

export type AddGroupActionPromptRef = {
  show: (initAct?: GroupActionAct) => Promise<GroupActionAct | undefined>
}

const DEFAULT_PRAYER_PROMPTS = [
  'What do you need prayer for today?',
  'Does someone in your life need prayer?',
  'Is there something in the world we can pray for?',
]

const DEFAULT_GRATITUDE_PROMPTS = [
  'What are you thankful to God for today?',
  'Who are you thankful for this week and why?',
  'Share how God has moved in your life recently',
]

const AddGroupActionPrompt: ForwardRefRenderFunction<
  AddGroupActionPromptRef,
  Props
> = ({ mode }, ref) => {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const resolveRef = useRef<((act?: GroupActionAct) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('content', initAct.text)
      }
      return new Promise<GroupActionAct | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onFinish = async (values: { content: string }) => {
    resolveRef.current?.({
      type: 'action',
      actionType: mode,
      text: values.content,
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
        <H5>
          {mode === 'prayer'
            ? t('plans.add-prayer-prompt-title')
            : t('plans.add-gratitude-prompt-title')}
        </H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="content"
            label={
              <Text strong>
                {mode === 'prayer'
                  ? t('plans.write-own-prayer-prompt')
                  : t('plans.write-own-gratitude-prompt')}
              </Text>
            }
          >
            <Input
              placeholder={
                mode === 'prayer'
                  ? t('plans.enter-prayer-prompt')
                  : t('plans.enter-gratitude-prompt')
              }
            />
          </Form.Item>
          <Form.Item
            label={
              <Text strong>
                {mode === 'prayer'
                  ? t('plans.choose-prayer-prompt')
                  : t('plans.choose-gratitude-prompt')}
              </Text>
            }
            shouldUpdate
          >
            {() => (
              <div className="space-y-3">
                {(mode === 'prayer'
                  ? DEFAULT_PRAYER_PROMPTS
                  : DEFAULT_GRATITUDE_PROMPTS
                ).map((item) => (
                  <BorderButton
                    key={item}
                    className="flex w-full"
                    shape="default"
                    onClick={() => {
                      form.setFieldValue('content', item)
                    }}
                    activated={item === form.getFieldValue('content')}
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
            {() => {
              return (
                <Button
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                  disabled={!form.getFieldValue('content')}
                >
                  {t('done')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddGroupActionPrompt)
