import { Activity } from '@dts/Plans'
import usePlanDetailData from '@hooks/usePlanDetailData'
import { useAppSelector } from '@redux/hooks'
import { updateOrgPlan } from '@shared/Firebase/plan'
import { message } from 'antd'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'

const useDayDetailData = ({
  planId,
  dayIndex,
}: {
  planId: string
  dayIndex: number
}) => {
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me)
  const { plan, loading } = usePlanDetailData({
    planId,
  })
  const block = useMemo(
    () =>
      plan?.blocks[dayIndex]
        ? { ...plan?.blocks[dayIndex], dayIndex: dayIndex + 1 }
        : null,
    [dayIndex, plan?.blocks]
  )

  const handleUpdateBlock = useCallback(
    async (activities: Activity[]) => {
      if (!plan || !block) {
        return
      }

      const { success, message: errorMessage } = await updateOrgPlan({
        plan: {
          id: planId,
          blocks: plan.blocks.map((block, index) =>
            index === dayIndex
              ? {
                  ...block,
                  activities,
                }
              : block
          ),
        },
        organisationId: me.organisation.id,
      })

      if (!success) {
        console.error('update plan Error: ', errorMessage)
        message.error(t('error-server'))
        return
      }
      message.success(t('plans.day-saved'))
    },
    [block, dayIndex, me.organisation.id, plan, t]
  )

  return {
    loading,
    plan,
    block,
    handleUpdateBlock,
  }
}

export default useDayDetailData
