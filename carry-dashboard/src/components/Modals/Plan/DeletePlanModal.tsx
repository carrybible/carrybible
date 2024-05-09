import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { H5, Text } from '@components/Typography'
import { PLAN_TYPE_TABLE, PlanTypeTable } from '@shared/Constants'
import { deleteOrgPlan, updateOrgPlan } from '@shared/Firebase/plan'
import { Avatar, Modal, Spin, message } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onDeleted?: () => void
  planType?: PlanTypeTable
}

interface PlanInfoDelete {
  organizationId: string
  planId: string
  planAvatar: string
  planName: string
  markAsTemplate?: boolean
  shareWithMobile?: boolean
}

export type DeletePlanModalRef = {
  show: (planInfo: PlanInfoDelete) => void
}

const DeletePlanModal: ForwardRefRenderFunction<DeletePlanModalRef, Props> = (
  { onDeleted, planType },
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [planInfo, setPlanInfo] = useState<PlanInfoDelete | undefined>()
  const [spinning, setSpinning] = useState(false)
  const { t } = useTranslation()
  const show = (planInfo: PlanInfoDelete) => {
    setIsModalVisible(true)
    setPlanInfo(planInfo)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleDeletePlan = async () => {
    if (!planInfo) {
      return
    }
    setSpinning(true)

    if (!planType || planType === PLAN_TYPE_TABLE.ALL) {
      const isDelete = await deleteOrgPlan(
        planInfo.organizationId,
        planInfo.planId
      )
      if (isDelete) {
        setIsModalVisible(false)
        onDeleted?.()
      }
    } else {
      const markAsTemplate =
        planType === PLAN_TYPE_TABLE.TEMPLATE ? false : planInfo.markAsTemplate
      const shareWithMobile =
        planType === PLAN_TYPE_TABLE.FEATURE ? false : planInfo.shareWithMobile
      const { success, message: errorMessage } = await updateOrgPlan({
        organisationId: planInfo.organizationId || '',
        plan: {
          id: planInfo.planId,
          markAsTemplate: !!markAsTemplate,
          shareWithMobile: !!shareWithMobile,
        },
      })
      if (!success) {
        console.error('update plan Error: ', errorMessage)
        message.error(t('error-server'))
        return
      } else {
        setIsModalVisible(false)
        onDeleted?.()
      }
    }
    setSpinning(false)
  }

  if (!planInfo) {
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
      destroyOnClose
      centered
    >
      <Spin spinning={spinning}>
        <div className={classNames('flex flex-col', 'items-center', 'pt-10')}>
          <H5>
            {!planType || planType === PLAN_TYPE_TABLE.ALL
              ? t('plan.delete')
              : planType === PLAN_TYPE_TABLE.FEATURE
              ? t('plan.remove-featured')
              : t('plan.remove-templates')}
          </H5>
          <Avatar
            shape="square"
            className="mt-10 rounded-xl"
            src={planInfo.planAvatar}
            size={107}
          />
          <Text className="mt-3" strong>
            {planInfo.planName}
          </Text>
          {!planType || planType === PLAN_TYPE_TABLE.ALL ? (
            <Text className="mt-10 text-center">
              {t('plan.delete-warning-1')}
              <Text strong>{planInfo.planName}</Text>
              {t('plan.delete-warning-2')}
            </Text>
          ) : planType === PLAN_TYPE_TABLE.FEATURE ? (
            <Text className="mt-10 text-center">
              {t('plan.remove-warning-1')}
              <Text strong>{planInfo.planName}</Text>
              {t('plan.remove-warning-2-featured')}
            </Text>
          ) : (
            <Text className="mt-10 text-center">
              {t('plan.remove-warning-1')}
              <Text strong>{planInfo.planName}</Text>
              {t('plan.remove-warning-2-templates')}
            </Text>
          )}

          <Button className="mt-10" type="danger" onClick={handleDeletePlan}>
            {!planType || planType === PLAN_TYPE_TABLE.ALL
              ? t('plan.delete-btn')
              : planType === PLAN_TYPE_TABLE.FEATURE
              ? t('plan.remove-btn-featured')
              : t('plan.remove-btn-templates')}
          </Button>
        </div>
      </Spin>
    </Modal>
  )
}

export default forwardRef(DeletePlanModal)
