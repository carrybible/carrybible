import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import BorderButton from '@components/Button/BorderButton'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import PlusCircleIcon from '@assets/icons/PlusCircleIcon.svg'
import PlusCircleFilledIcon from '@assets/icons/PlusCircleFilledIcon.svg'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useAppSelector } from '@redux/hooks'
import _, { uniq } from 'lodash'

const MAX_SUGGESTED_AMOUNT = 3
const MIN_SUGGESTED_AMOUNT = 3
const DEFAULT_SUGGESTED = [5, 10, 15, 20, 25, 50, 75, 100]

type Props = {}

export type SuggestedGiftModalRef = {
  show: (selectedValues?: number[] | undefined) => Promise<number[] | undefined>
}

const SuggestedGiftModal: ForwardRefRenderFunction<
  SuggestedGiftModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const giving = useAppSelector((state) => state.giving)
  const [suggestedAmounts, setSuggestedAmount] =
    useState<number[]>(DEFAULT_SUGGESTED)
  const [currentCurrency, setCurrentCurrency] = useState<any>(null)

  const [values, setValues] = useState<number[]>([])
  const [form] = Form.useForm()
  const resolveRef = useRef<((suggested: number[] | undefined) => void) | null>(
    null
  )

  const { t } = useTranslation()

  useImperativeHandle(ref, () => ({
    show: (selectedValues?: number[] | undefined) => {
      setIsModalVisible(true)
      if (!_.isNil(selectedValues)) {
        const newSuggestedAmounts = uniq([
          ...selectedValues,
          ...suggestedAmounts,
        ])
        setSuggestedAmount(newSuggestedAmounts)
        setValues(selectedValues)
      }

      return new Promise<number[] | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    resolveRef.current = null
    setIsModalVisible(false)
    setValues([])
  }

  const onFinish = async () => {
    if (values.length === MIN_SUGGESTED_AMOUNT) {
      resolveRef.current?.(values)
      handleCancel()
    }
  }

  const handleChooseItem = (item: number) => {
    const isExist = values.indexOf(item)
    let newValues: number[] = values
    if (isExist > -1) {
      values.splice(isExist, 1)
      newValues = [...values]
    } else {
      if (values.length < MAX_SUGGESTED_AMOUNT) {
        newValues = [...values, item]
      }
    }
    setValues(newValues)
  }

  const onAddNewValue = () => {
    const newValue = Number(form.getFieldValue('inputAmount'))
    let currentList = [...suggestedAmounts]
    if (currentList.indexOf(newValue) === -1) {
      currentList.push(newValue)
      setSuggestedAmount(currentList)
    }
  }

  useEffect(() => {
    const currentAmounts =
      giving.settingCurrencies?.[giving.currentCurrenciesGiving || '']
    if (currentAmounts) {
      setSuggestedAmount(currentAmounts.suggestions)
      setCurrentCurrency(currentAmounts)
    }
  }, [giving.settingCurrencies, giving.currentCurrenciesGiving])

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
        <H5>{t('giving.suggested-gift-title')}</H5>
        <Text className="px-16 py-10 text-center text-neutral-80">
          {t('giving.suggested-gift-description')}
        </Text>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            label={<Text strong>{t('giving.choose-suggested-amount')}</Text>}
            shouldUpdate
          >
            {() => (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {suggestedAmounts.map((item) => (
                  <BorderButton
                    key={item}
                    className="flex"
                    activated={values.includes(item)}
                    onClick={() => {
                      handleChooseItem(item)
                    }}
                  >
                    {currentCurrency?.symbol
                      ? `${currentCurrency?.symbol} ${item}`
                      : item}
                  </BorderButton>
                ))}
              </div>
            )}
          </Form.Item>
          <Form.Item
            name="inputAmount"
            label={<Text strong>{t('giving.add-custom-amount')}</Text>}
          >
            <Input
              type="number"
              className="group !py-0"
              placeholder={t('giving.enter-custom-amount', {
                symbol: currentCurrency?.symbol || '',
              })}
              suffix={
                <Button
                  className={classNames(
                    'flex h-[26px] w-[26px] items-center justify-center rounded',
                    'bg-transparent hover:bg-transparent border-0 px-0 py-0 shadow-none'
                  )}
                  onClick={onAddNewValue}
                >
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="absolute flex items-center justify-center">
                      <Image
                        className="!absolute opacity-100 group-hover:opacity-0"
                        src={PlusCircleIcon}
                        alt="add-new"
                        width={26}
                        height={26}
                      />
                    </div>
                    <div className="absolute flex items-center justify-center">
                      <Image
                        className="opacity-0 group-hover:opacity-100"
                        src={PlusCircleFilledIcon}
                        alt="add-new"
                        width={26}
                        height={26}
                      />
                    </div>
                  </div>
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                className="w-1/2"
                type="primary"
                htmlType="submit"
                disabled={values.length < MIN_SUGGESTED_AMOUNT}
              >
                {t('done')}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(SuggestedGiftModal)
