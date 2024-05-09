import XCircleIcon from '@assets/icons/XCircleIcon.svg'

import Button from '@components/Button'

import DashboardUserInput from '@components/Input/DashboardUserInput'
import { H5, Text } from '@components/Typography'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { inviteToDashboard } from '@shared/Firebase/invite'

import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onSelectRole?: () => Promise<
    'admin' | 'campus-leader' | 'campus-user' | undefined
  >
  onSelectCampus?: () => Promise<
    { campusId: string; campusName: string } | undefined
  >
  reload: () => void
}

export type InviteToDashboardModalRef = {
  show: () => void
}

const InviteToDashboardModal: ForwardRefRenderFunction<
  InviteToDashboardModalRef,
  Props
> = ({ onSelectRole, onSelectCampus, reload }, ref) => {
  const [loading, setLoading] = useState(false)
  const { startLoading, stopLoading } = useGlobalLoading()
  const [form] = Form.useForm()
  const { t } = useTranslation()

  const [isModalVisible, setModalVisble] = useState(false)

  const show = useCallback(() => {
    form.resetFields()
    setModalVisble(true)
    setLoading(false)
  }, [form])

  const hide = useCallback(() => {
    setModalVisble(false)
  }, [])

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    hide()
    setLoading(false)
  }

  const onFinish = async (values: {
    user?: { emails?: string[]; userIds?: string[] }
  }) => {
    setLoading(true)
    if (onSelectRole) {
      const role = await onSelectRole()
      let campus: { campusId: string; campusName: string } | undefined =
        undefined
      if (role !== 'admin' && onSelectCampus) {
        campus = await onSelectCampus()
      }

      await startLoading()
      const { success, message: errorMsg } = await inviteToDashboard({
        uids: values?.user?.userIds || [],
        emails: values?.user?.emails || [],
        role: role!!,
        campusId: campus?.campusId,
        t,
      })

      if (success) {
        message.success(t('settings.invite-success'))
        reload()
      } else message.error(errorMsg)
    }
    setLoading(false)
    stopLoading()
    hide()
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
        <H5>{t('settings.invite-a-dashboard-user')}</H5>

        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-10/12 sm:mr-0 sm:w-full"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
          disabled={loading}
        >
          <Form.Item
            name="user"
            label={<Text strong>{t('settings.dashboard-user')}</Text>}
          >
            <DashboardUserInput />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 20 }} shouldUpdate>
            {() => {
              const user = form.getFieldValue('user')
              const disabled = !user?.emails?.length && !user?.userIds?.length
              return (
                <Button
                  disabled={disabled}
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  onClick={() => setModalVisble(false)}
                >
                  {t('continue')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(InviteToDashboardModal)
