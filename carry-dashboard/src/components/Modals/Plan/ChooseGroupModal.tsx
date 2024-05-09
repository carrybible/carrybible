import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import GroupInput from '@components/Input/GroupInput'
import { H5, SmallText } from '@components/Typography'
import { Plan } from '@dts/Plans'
import usePublishAndApplyPlan from '@hooks/usePublishAndApplyPlan'

import DatePicker from '@components/Calendar'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { wait } from '@shared/Utils'
import { DatePickerProps, message, Modal } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
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

type Props = {
  onData?: (groupIds: string[], startDate: Date) => void
  plan: Plan
  onSuccess?: (groupId: string) => void
}

const STEP_CHOOSE_GROUP = 0
const STEP_PICK_START_DATE = 1

export type ChooseGroupModalRef = {
  show: () => void
}

const ChooseGroupModal: ForwardRefRenderFunction<ChooseGroupModalRef, Props> = (
  { plan, onSuccess },
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState<number>()
  const [isDateValid, setDateValid] = useState(false)
  const { stopLoading, startLoading } = useGlobalLoading()

  const { handlePublishGoal } = usePublishAndApplyPlan({
    groupIds,
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
    if (startDate && groupIds?.length) {
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
        if (groupIds.length > 0) onSuccess?.(groupIds[0])
      }

      clearData()
      stopLoading()
    }
  }, [
    startDate,
    groupIds,
    startLoading,
    t,
    handlePublishGoal,
    stopLoading,
    onSuccess,
  ])

  const clearData = () => {
    setStartDate(undefined)
    setGroupIds([])
  }

  const renderPickGroup = useMemo(() => {
    return (
      <>
        <H5 className="px-5 text-center">{t('plans.choose-group-title')}</H5>
        <div className="my-4 w-full">
          <GroupInput
            className="w-full"
            placeholder={
              <SmallText className="ml-2 text-neutral-70">
                {t('plans.enter-group')}
              </SmallText>
            }
            onChange={(ids) => {
              if (ids) {
                setGroupIds(ids)
              }
            }}
          />
        </div>
        <Button
          onClick={() => setStep(STEP_PICK_START_DATE)}
          disabled={!groupIds.length}
          className="w-1/2"
          type="primary"
        >
          {t('done')}
        </Button>
      </>
    )
  }, [groupIds, t])

  const renderPickDate = useMemo(() => {
    return (
      <>
        <H5 className="px-5 text-center">{t('plans.when-will-study-start')}</H5>
        <DatePicker
          className="my-4 w-full"
          onChange={onDateChange}
          format="dddd, MMM DD"
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
        {step === STEP_CHOOSE_GROUP && renderPickGroup}
        {step === STEP_PICK_START_DATE && renderPickDate}
      </div>
    </Modal>
  )
}

export default forwardRef(ChooseGroupModal)
