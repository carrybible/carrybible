import _, { values } from 'lodash'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Form, Modal } from 'antd'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'

import { H5, Text } from '@components/Typography'
import Button from '@components/Button'
import InputNumber from '@components/Input/InputNumber'
import Select from '@components/Select'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { getCurrencies } from '@shared/Firebase/settings'
import { updateGiving } from '@redux/slices/giving'

import IcXCircle from '@assets/icons/XCircleIcon.svg'

export type GoalAmount = {
  goal: number
  currency: string
}

export type SetGoalAmountCampaignModalRef = {
  show: (goal?: number, currency?: string) => Promise<GoalAmount>
}

const SetGoalAmountCampaignModal: ForwardRefRenderFunction<
  SetGoalAmountCampaignModalRef,
  {}
> = ({}, ref) => {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()
  const giving = useAppSelector((state) => state.giving)

  const [isShowModal, setIsShowModal] = useState<boolean>(false)

  const [goal, setGoal] = useState<number>(0)

  const resolveRef = useRef<((goalAmount: GoalAmount) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (goal?: number, currency?: string) => {
      setIsShowModal(true)

      if (!_.isNil(goal)) {
        setGoal(goal)
      }

      if (!_.isNil(currency)) {
        dispatch(
          updateGiving({
            currentCurrenciesGiving: currency,
          })
        )
      }

      return new Promise((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  useEffect(() => {
    const getData = async () => {
      if (isShowModal) {
        const list = await getCurrencies()
        dispatch(
          updateGiving({
            currencies: values(list),
            settingCurrencies: list,
          })
        )
      }
    }

    getData()
  }, [dispatch, isShowModal])

  const handleFormSubmit = async () => {
    setIsShowModal(false)

    resolveRef.current!({
      goal,
      currency: giving.currentCurrenciesGiving!,
    })
  }

  const handleCancel = () => {
    setIsShowModal(false)

    setGoal(0)
  }

  return (
    <Modal
      closable
      visible={isShowModal}
      onCancel={handleCancel}
      closeIcon={<Image src={IcXCircle} alt="" width={22} height={22} />}
      footer={null}
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
      destroyOnClose={true}
    >
      <div className="flex flex-col items-center">
        <H5>Set Campaign Goals</H5>
        <Form
          onFinish={handleFormSubmit}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item name="amount" label={<Text>Amount</Text>}>
            <InputNumber
              placeholder="Enter goal amount ex. 1500"
              defaultValue={goal}
              onChange={(e) => setGoal(e as number)}
              className="!px-3 text-base"
            />
          </Form.Item>
          <Form.Item name="default_currency" label={<Text>Currency</Text>}>
            <Select
              defaultValue={giving.currentCurrenciesGiving}
              options={giving!.currencies!.map((c) => ({
                key: c.value,
                value: c.value,
                label: `${c.symbol} ${c.value}`,
              }))}
              onChange={(currentCurrenciesGiving: string) =>
                dispatch(
                  updateGiving({
                    currentCurrenciesGiving,
                    suggestAmounts: giving.settingCurrencies
                      ? giving.settingCurrencies[currentCurrenciesGiving]
                          .suggestions
                      : [],
                  })
                )
              }
              placeholder="Default Currency"
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              span: 24,
              offset: 2,
              sm: { span: 20, offset: 7 },
            }}
            shouldUpdate
          >
            {() => {
              const isValid =
                goal > 0 && !_.isEmpty(giving.currentCurrenciesGiving || '')

              return (
                <Button
                  loading={false}
                  disabled={!isValid}
                  className="w-full sm:w-1/2"
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

export default forwardRef(SetGoalAmountCampaignModal)
