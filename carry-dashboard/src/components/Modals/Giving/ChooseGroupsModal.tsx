import { Form, Modal } from 'antd'
import { useTranslation } from 'next-i18next'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Image from 'next/image'
import { H5, SmallText } from '@components/Typography'
import classNames from 'classnames'
import Button from '@components/Button'
import GroupInput from '@components/Input/GroupInput'

type Props = {
  // mode: 'create' | 'update'
  defaultGroup?: string[]
}

export type ChooseGroupsModalRef = {
  show: () => Promise<string[] | undefined>
}

const ChooseGroupsModal: ForwardRefRenderFunction<
  ChooseGroupsModalRef,
  Props
> = ({ defaultGroup }, ref) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [groupIds, setGroupIds] = useState<string[]>([])

  const [loading, setLoading] = useState(false)

  const resolveRef = useRef<((groupIds: string[] | undefined) => void) | null>(
    null
  )

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<string[] | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setGroupIds([])
    setIsModalVisible(false)
  }

  const onFinish = () => {
    resolveRef.current?.(groupIds)
    setLoading(false)
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
      destroyOnClose={true}
    >
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5>{t('giving.select-groups-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 w-full px-2 sm:mr-0 sm:px-8"
          layout="vertical"
          labelCol={{ span: 14 }}
          wrapperCol={{ span: 24 }}
          disabled={loading}
        >
          <Form.Item name="groups" required initialValue={defaultGroup}>
            <GroupInput
              className="w-full"
              placeholder={
                <SmallText className="ml-2 text-neutral-70">
                  {t('giving.select-groups')}
                </SmallText>
              }
              onChange={(ids) => {
                if (ids) {
                  setGroupIds(ids)
                }
              }}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
            <Button
              loading={loading}
              disabled={loading}
              className="w-1/2"
              type="primary"
              htmlType="submit"
            >
              {t('continue')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(ChooseGroupsModal)
