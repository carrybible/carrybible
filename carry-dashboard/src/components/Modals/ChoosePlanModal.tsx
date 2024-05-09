import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { H5, SmallText } from '@components/Typography'
import usePublishAndApplyPlan from '@hooks/usePublishAndApplyPlan'

import useGlobalLoading from '@hooks/useGlobalLoading'
import { wait } from '@shared/Utils'
import { DatePickerProps, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import moment from 'moment'
import PlanInput from '@components/Input/PlanInput'
import DatePicker from '@components/Calendar'

type Props = {
  onData?: (groupId: string, startDate: Date) => void
  groupId: string
  onPlanSuccess?: (isSuccess: boolean) => void
}

const STEP_CHOOSE_PLAN = 0
const STEP_PICK_START_DATE = 1

export type ChoosePlanModalRef = {
  show: () => void
}

const ChoosePlanModal: ForwardRefRenderFunction<ChoosePlanModalRef, Props> = (
  { groupId, onPlanSuccess },
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const [startDate, setStartDate] = useState<number>()
  const [isDateValid, setDateValid] = useState(false)
  const { stopLoading, startLoading } = useGlobalLoading()
  const [plan, setPlan] = useState<any>(undefined)

  const { handlePublishGoal } = usePublishAndApplyPlan({
    groupIds: [groupId],
    plan: { ...plan, state: 'completed' },
    startDate: (startDate && new Date(startDate)) || new Date(),
  })

  const [step, setStep] = useState(0)
  const { t } = useTranslation()

  useImperativeHandle(ref, () => ({
    show: () => {
      setStep(0)
      setIsModalVisible(true)
    },
  }))

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const onDateChange: DatePickerProps['onChange'] = (date) => {
    if (!date) {
      setDateValid(false)
      return message.error(t('errors.missing-date'))
    }
    const today = moment().format('YYYYMMDD')
    const scheduleDate = date.format('YYYYMMDD')

    if (scheduleDate < today) {
      setDateValid(false)
      return message.error(t('errors.future-date'))
    }
    setDateValid(true)
    setStartDate(date.toDate().getTime())
  }

  const onDone = useCallback(async () => {
    if (startDate && plan) {
      setIsModalVisible(false)

      await startLoading({
        message: t('plans.schedule-plan-message'),
        background: 'primary',
      })
      const { success, message: errorMessage } = await handlePublishGoal()
      if (!success) {
        console.error('public goal Error: ', errorMessage)
        message.error(t('error-server'))
      } else {
        await startLoading({
          message: t('plans.scheduled-plan'),
          background: 'primary',
        })
        await wait(1500)
        stopLoading()
        onPlanSuccess && onPlanSuccess(true)
      }

      clearData()
      stopLoading()
    }
  }, [plan, handlePublishGoal, startDate, stopLoading, startLoading, t])

  const clearData = () => {
    setStartDate(undefined)
    setPlan(undefined)
  }

  const renderPickPlan = useMemo(() => {
    return (
      <>
        <H5 className="px-5 text-center">{t('group.choose-plan-title')}</H5>
        <PlanInput
          className="my-4 w-full"
          placeholder={
            <SmallText className="ml-3 text-neutral-70">
              {t('group.enter-plan')}
            </SmallText>
          }
          onChange={(v) => setPlan(v)}
          autoClose={true}
        />
        <Button
          onClick={() => setStep(STEP_PICK_START_DATE)}
          disabled={!plan}
          className="w-1/2"
          type="primary"
        >
          {t('done')}
        </Button>
      </>
    )
  }, [plan, t])

  const renderPickDate = useMemo(() => {
    return (
      <>
        <H5 className="px-5 text-center">{t('plans.when-will-study-start')}</H5>
        <DatePicker
          className="my-4 w-full"
          onChange={onDateChange}
          format="dddd, MMM DD"
          clearIcon={false}
        />
        <Button
          onClick={onDone}
          disabled={!isDateValid}
          className="w-1/4 self-center"
          type="primary"
        >
          {t('continue')}
        </Button>
      </>
    )
  }, [isDateValid, t, onDone])

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
        {step === STEP_CHOOSE_PLAN && renderPickPlan}
        {step === STEP_PICK_START_DATE && renderPickDate}
      </div>
    </Modal>
  )
}

export default forwardRef(ChoosePlanModal)
