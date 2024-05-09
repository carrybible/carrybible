import Button from '@components/Button'
import { H5, Text } from '@components/Typography'
import { Plan } from '@dts/Plans'
import { useAppSelector } from '@redux/hooks'
import { getGroupDetails } from '@shared/Firebase/group'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import HandIcon from '@assets/icons/Hand.svg'
import {
  applyStudyPlanToGroup,
  checkOverlapPlans,
  publishOrgPlanToGroup,
} from '@shared/Firebase/plan'
import { message, Modal } from 'antd'
import { useTranslation } from 'next-i18next'
import { useCallback } from 'react'
import useGlobalLoading from './useGlobalLoading'
import Image from 'next/image'
import classNames from 'classnames'

const usePublishAndApplyPlan = ({
  groupIds,
  plan,
  startDate,
}: {
  groupIds: string[]
  plan: Plan
  startDate: Date
}) => {
  // const groupId = groupIds[0]
  const organisation = useAppSelector((state) => state.me.organisation)
  const { t } = useTranslation()
  const { stopLoading, startLoading } = useGlobalLoading()

  const validatePlan = useCallback(() => {
    if (!plan.name) {
      return t('plan.study-name-cannot-empty')
    } else if (plan.blocks.length === 0) {
      return t('plan.please-add-study-block')
    }
    for (let blockIndex = 0; blockIndex < plan.blocks.length; blockIndex++) {
      const block = plan.blocks[blockIndex]

      if (!block.name) {
        return t('plan.block-have-no-title', {
          blockValue: `${t('day')} ${blockIndex + 1}`,
        })
      } else if (block.activities.length === 0) {
        return t('plan.block-empty', {
          paceValue: t('day'),
          blockIndex: blockIndex + 1,
        })
      }
    }
  }, [plan, t])

  const requestPublish = useCallback(
    async (startDate: Date, groupId: string) => {
      if (!plan) {
        return { success: false, message: t('plan.unable-to-publish-study') }
      }
      const groupPlan = await applyStudyPlanToGroup(groupId, plan, startDate)
      if (groupPlan) {
        return {
          success: true,
          message: '',
          planInstanceId: groupPlan.id,
        }
      } else {
        return { success: false, message: t('plan.unable-to-publish-study') }
      }
    },
    [plan, t]
  )

  const asyncConfirmModal = ({
    title,
    content,
  }: {
    title: string
    content: string
  }) => {
    return new Promise((resolve) => {
      return Modal.confirm({
        closable: true,
        centered: true,
        icon: null,
        onCancel: () => {},
        okButtonProps: { className: 'hidden' },
        cancelButtonProps: { className: 'hidden' },
        wrapClassName: 'overflow-scroll no-scrollbar py-10 bg-primary',
        closeIcon: (
          <Image src={XCircleIcon} alt="close-icon" width={22} height={22} />
        ),
        width: 'auto',
        content: (
          <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
            <H5>{title}</H5>
            <div className="pt-10 pb-4">
              <Image src={HandIcon} alt="confirm-icon" width={76} height={76} />
            </div>
            <div className="pb-10">
              <Text>{content}</Text>
            </div>
            <Button
              className="w-1/2"
              type="primary"
              onClick={() => {
                resolve(true)
                Modal.destroyAll()
              }}
            >
              {t('plan.replace-study')}
            </Button>
          </div>
        ),
      })
    })
  }

  const handlePublishGoal = useCallback(async () => {
    for (let i = 0; i < groupIds.length; i += 1) {
      const groupId = groupIds[i]
      const error = validatePlan()
      if (error) {
        message.error(error)
        return { success: false, message: error }
      }

      const checkOverlapResp = await checkOverlapPlans(
        groupId,
        startDate.getTime(),
        plan.duration,
        'day'
      )
      const group = await getGroupDetails({ groupId })
      if (checkOverlapResp.data?.length) {
        const overlappedCurrentActivePlan = checkOverlapResp.data.some(
          (i: any) => i.id === group?.data?.activeGoal?.id
        )

        stopLoading()

        const title = !overlappedCurrentActivePlan
          ? t('plan.overlapped-future-plan-title')
          : t('plan.overlapped-current-plan-tile')

        const description = !overlappedCurrentActivePlan
          ? t('plan.overlapped-future-plan')
          : t('plan.overlapped-current-plan')

        const isConfirm = await asyncConfirmModal({
          title,
          content: description,
        })

        if (!isConfirm) {
          if (i === groupIds.length - 1)
            return { success: false, message: description }
          else {
            await startLoading({
              message: t('plans.schedule-plan-message'),
              background: 'primary',
            })
            continue
          }
        } else {
          await startLoading({
            message: t('plans.schedule-plan-message'),
            background: 'primary',
          })
        }
      }
      const publishResult = await requestPublish(startDate, groupId)
      if (publishResult.success) {
        const { success, message } = await publishOrgPlanToGroup(
          organisation.id,
          plan.id,
          publishResult.planInstanceId!!,
          groupId,
          plan,
          startDate,
          group.data
        )
        if (!success) return { success, message }
      } else {
        return publishResult
      }
    }
    return { success: true }
  }, [
    groupIds,
    validatePlan,
    startDate,
    plan,
    requestPublish,
    stopLoading,
    t,
    asyncConfirmModal,
    startLoading,
    organisation.id,
  ])

  return { handlePublishGoal }
}

export default usePublishAndApplyPlan
