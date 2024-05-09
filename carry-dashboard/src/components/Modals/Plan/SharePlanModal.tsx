import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import { H1, H5, Text } from '@components/Typography'
import { Avatar, Form, message, Modal, Spin } from 'antd'
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
import Switch from '@components/Switch'
import Button from '@components/Button'
import { Plan } from '@dts/Plans'
import { SwitchChangeEventHandler } from 'antd/lib/switch'
import useOrganisationInfo from '@hooks/useOrganisationInfo'
import { updateOrgPlan } from '@shared/Firebase/plan'

type Props = {
  onData?: (activity: string) => void
}

export type SharePlanModalRef = {
  show: (plan: Plan) => void
}

type OptionItemProps = {
  icon?: string
  iconImage?: string
  title: string
  description: string
  onChange?: SwitchChangeEventHandler
  checked?: boolean
}

const OptionItem: FC<OptionItemProps> = (props) => {
  return (
    <div
      className={classNames(
        'flex flex-row',
        'mx-2 my-2 px-6 py-2',
        'bg-neutral-10'
      )}
    >
      <div className="mr-3 flex min-w-[56px] flex-col justify-center">
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
      <div className="flex items-center pl-4">
        <Switch onChange={props.onChange} checked={props.checked} />
      </div>
    </div>
  )
}

const SharePlanModal: ForwardRefRenderFunction<SharePlanModalRef, Props> = (
  {},
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [plan, setPlan] = useState<Plan>()
  const [markAsTemplate, setMarkAsTemplate] = useState<boolean>()
  const [shareWithMobile, setShareWithMobile] = useState<boolean>()
  const [updateLoading, setUpdateLoading] = useState(false)
  const [form] = Form.useForm()
  const { organisationInfo, loading } = useOrganisationInfo()
  const { t } = useTranslation()
  const show = (plan: Plan) => {
    setPlan(plan)
    setMarkAsTemplate(plan.markAsTemplate)
    setShareWithMobile(plan.shareWithMobile)
    setIsModalVisible(true)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    setMarkAsTemplate(false)
    setShareWithMobile(false)
    setIsModalVisible(false)
  }

  const onFinish = async () => {
    setUpdateLoading(true)
    const { success, message: errorMessage } = await updateOrgPlan({
      organisationId: organisationInfo?.id || '',
      plan: {
        id: plan!!.id,
        markAsTemplate: !!markAsTemplate,
        shareWithMobile: !!shareWithMobile,
      },
    })
    if (!success) {
      console.error('update plan Error: ', errorMessage)
      message.error(t('error-server'))
      return
    }
    setUpdateLoading(false)
    message.success(t('plan.plan-updated'))
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
      <Spin spinning={loading}>
        <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
          <H5>{t('plans.share-plan-title')}</H5>
          <Avatar
            shape="square"
            className="mt-6 rounded-2xl"
            src={plan?.featuredImage}
            size={107}
          />
          <Text strong className="pt-3 text-center">
            {plan?.name}
          </Text>
          <Form
            form={form}
            onFinish={onFinish}
            className="mt-6 mr-10 w-full sm:mr-0"
            layout="vertical"
          >
            <Form.Item name="publishTemplate">
              <OptionItem
                iconImage={organisationInfo?.image}
                title={t('plan.publish-as-template')}
                description={t('plan.publish-template-desc', {
                  orgName: organisationInfo?.name,
                })}
                checked={markAsTemplate}
                onChange={setMarkAsTemplate}
              />
            </Form.Item>
            <Form.Item name="shareWithMobileGroups">
              <OptionItem
                icon="📱"
                title={t('plans.share-with-mobile')}
                description={t('plans.share-with-mobile-desc')}
                checked={shareWithMobile}
                onChange={setShareWithMobile}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 7, span: 20 }} shouldUpdate>
              {() => (
                <Button
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                  loading={updateLoading}
                >
                  {t('done')}
                </Button>
              )}
            </Form.Item>
          </Form>
        </div>
      </Spin>
    </Modal>
  )
}

export default forwardRef(SharePlanModal)
