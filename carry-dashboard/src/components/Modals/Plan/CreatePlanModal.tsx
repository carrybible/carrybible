import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
// import GroupLeaderInput, {
//   LeaderSelectedValue,
// } from '@components/Input/GroupLeaderInput'
import { H5, Text } from '@components/Typography'
import { Plan } from '@dts/Plans'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { useAppSelector } from '@redux/hooks'
import { createOrgPlan, updateOrgPlan } from '@shared/Firebase/plan'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { Timestamp } from 'firebase/firestore'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onEnterDuration?: () => Promise<number | undefined>
  onEnterCampus?: () => Promise<string | undefined>
  handleUseTemplate?: ({
    name,
    description,
    featuredImage,
  }: {
    name: string
    description: string
    featuredImage: string
  }) => void
}

export type PlanCreationModalRef = {
  show: (plan?: Plan, mode?: 'edit' | 'template') => void
}

const PlanCreationModal: ForwardRefRenderFunction<
  PlanCreationModalRef,
  Props
> = ({ onEnterDuration, onEnterCampus, handleUseTemplate }, ref) => {
  const me = useAppSelector((state) => state.me)
  const { startLoading, stopLoading } = useGlobalLoading()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'template'>('create')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [form] = Form.useForm()
  const [avatar, setAvatar] = useState<ChooseImageType>({ src: '' })
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useImperativeHandle(ref, () => ({
    show: (plan?: Plan, mode: 'edit' | 'template' = 'edit') => {
      if (plan) {
        setMode(mode)
        setPlan(plan)
        setAvatar({ src: plan.featuredImage })
        form.setFieldValue('planName', plan.name)
        form.setFieldValue('planDescription', plan.description)
      }
      setIsModalVisible(true)
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setAvatar({ src: '' })
    setPlan(null)
    setIsModalVisible(false)
    setLoading(false)
  }

  const onImage = (img: ChooseImageType) => {
    setAvatar(img)
  }

  const onFinish = async (values: {
    planName: string
    planDescription: string
    planAuthor: string
  }) => {
    setLoading(true)
    try {
      if (mode === 'create' && onEnterDuration && onEnterCampus) {
        let campus: string | null | undefined =
          (me.organisation.role !== 'admin' &&
            me.organisation.role !== 'owner' &&
            me.campusAccess?.[0]?.id) ||
          null

        if (
          (me?.campusAccess?.length || 0) >= 2 &&
          me.organisation.role !== 'admin' &&
          me.organisation.role !== 'owner'
        ) {
          const campusId = await onEnterCampus()
          if (campusId) {
            campus = me?.campusAccess?.find((i) => i.id === campusId)?.id
          } else campus = null
        }
        setIsModalVisible(false)
        const duration = await onEnterDuration()

        if (duration === undefined) {
          handleCancel()
          return
        }

        const loadingId = await startLoading({
          message: '🛠 Let’s start building...',
          background: 'primary',
        })

        const {
          success,
          message: errorMessage,
          data,
        } = await createOrgPlan({
          organisationId: me.organisation.id,
          plan: {
            campus:
              (campus && {
                campusName:
                  me?.campusAccess?.find((x) => x.id === campus)?.name || '',
                campusId: campus || '',
              }) ||
              null,
            name: values.planName,
            description: values.planDescription,
            featuredImage: avatar.src!,
            author: me.uid,
            authorInfo: {
              name: values.planAuthor,
            },
            duration: duration,
            state: 'draft',
            type: 'advanced',
            mode: 'normal',
            pace: 'day',
            blocks: [...Array(duration)].map((_, index) => ({
              name: `Day ${index + 1}`,
              index,
              activities: [],
              created: Timestamp.now(),
            })),
          },
        })
        if (!success || !data) {
          console.error('create plan Error: ', errorMessage)
          message.error(t('error-server'))
          return
        }
        await router.push({
          pathname: `/plans/${data.planId}`,
          query: { mode: 'edit' },
        })
        stopLoading(loadingId)
      } else if (plan && mode === 'template') {
        handleUseTemplate?.({
          name: values.planName,
          description: values.planDescription,
          featuredImage: avatar.src || '',
        })
      } else if (plan && mode === 'edit') {
        const { success, message: errorMessage } = await updateOrgPlan({
          organisationId: me.organisation.id,
          plan: {
            id: plan.id,
            name: values.planName,
            description: values.planDescription,
            featuredImage: avatar.src,
            authorInfo: {
              name: values.planAuthor,
            },
          },
        })
        if (!success) {
          message.error(t(errorMessage ?? 'plan.update-plan-failed'))
          return
        }
        message.success(t('plan.plan-updated'))
      }
    } finally {
      setLoading(false)
      handleCancel()
    }
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
        <H5>{t('plans.plan-details')}</H5>
        <Avatar
          shape="square"
          className="mt-6 rounded-2xl"
          src={avatar?.src}
          uploadable
          size={107}
          onImage={onImage}
          randomAvatar={mode === 'create' && !avatar.src}
          title={t('change-plan-avatar')}
        />
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
          disabled={loading}
        >
          <Form.Item
            name="planName"
            label={<Text strong>{t('plans.plan-name')}</Text>}
          >
            <Input placeholder={t('plans.enter-plan-name')} />
          </Form.Item>
          <Form.Item
            name="planDescription"
            label={<Text strong>{t('plans.plan-description')}</Text>}
          >
            <Input placeholder={t('plans.enter-plan-description')} />
          </Form.Item>
          <Form.Item
            name="planAuthor"
            label={<Text strong>{t('plan.plan-author')}</Text>}
            initialValue={plan?.authorInfo?.name ?? me.name ?? me.email ?? ''}
          >
            <Input placeholder={t('plan.plan-author-description')} />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 7, span: 20 }} shouldUpdate>
            {() => {
              const planName = form.getFieldValue('planName')
              const planDescription = form.getFieldValue('planDescription')
              const planAuthor = form.getFieldValue('planAuthor')

              const validate =
                mode === 'create'
                  ? [planName, planDescription, avatar.src, planAuthor].every(
                      Boolean
                    )
                  : [
                      planName !== plan?.name,
                      planDescription !== plan?.description,
                      avatar.src !== plan?.featuredImage,
                      planAuthor != plan?.authorInfo?.name,
                    ].some(Boolean)

              return (
                <Button
                  loading={loading}
                  disabled={!validate || loading}
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
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

export default forwardRef(PlanCreationModal)
