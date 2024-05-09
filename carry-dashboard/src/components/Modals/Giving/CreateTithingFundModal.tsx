/* eslint-disable no-console */
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
import TextArea from '@components/Input/TextArea'
import Select from '@components/Select'
import { H5, Text } from '@components/Typography'
import { TithingFundDetail } from '@dts/Giving'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { updateGiving } from '@redux/slices/giving'
import { createTithingFund, updateTithingFun } from '@shared/Firebase/giving'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onChooseCampus?: () => Promise<string[] | undefined>
  onChooseSuggestedGift?: () => Promise<number[] | undefined>
  callbackUpdated?: (success: boolean) => void
}

export type CreateTithingFundModalRef = {
  show: (fund?: TithingFundDetail, mode?: 'edit') => void
}

type Option = {
  key: string
  value: string
  label: string
}

const CreateTithingFundModal: ForwardRefRenderFunction<
  CreateTithingFundModalRef,
  Props
> = (props, ref) => {
  const me = useAppSelector((state) => state.me)
  const { onChooseSuggestedGift, onChooseCampus, callbackUpdated } = props
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const giving = useAppSelector((state) => state.giving)
  const [form] = Form.useForm()
  const [mode, setMode] = useState<'create' | 'edit' | undefined>('create')
  const [fund, setFund] = useState<TithingFundDetail | null>(null)
  const [currencies, setCurrencies] = useState<Option[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [avatar, setAvatar] = useState<ChooseImageType>({ src: '', type: '' })
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    show: (fund?: TithingFundDetail, mode?: 'create' | 'edit') => {
      if (fund) {
        setMode(mode)
        setFund(fund)
        setAvatar({ src: fund.image })
        form.setFieldValue('name', fund.name)
        form.setFieldValue('description', fund.description)
        form.setFieldValue('defaultCurrency', fund.currency)
        handleChangeCurrency(fund.currency)
      } else {
        form.setFieldValue('defaultCurrency', 'USD')
      }
      setIsModalVisible(true)
      setCurrencies(
        giving?.currencies?.map((item) => ({
          key: item.value,
          value: item.value,
          label: `${item.symbol} ${item.value}`,
        })) || []
      )
    },
  }))

  const onImage = (img: ChooseImageType) => {
    setAvatar(img)
  }

  const handleCancel = () => {
    form.resetFields()
    setAvatar({ src: '' })
    setFund(null)
    setIsModalVisible(false)
    setLoading(false)
  }

  const handleChangeCurrency = (currentCurrenciesGiving: string) => {
    dispatch(
      updateGiving({
        currentCurrenciesGiving,
      })
    )
  }

  const onFinish = async (values: {
    name: string
    description: string
    defaultCurrency: string
  }) => {
    try {
      if (mode === 'create' && onChooseCampus && onChooseSuggestedGift) {
        if (
          ((me?.campusAccess?.length || 0) >= 2 &&
            me.organisation.role === 'admin') ||
          me.organisation.role === 'owner'
        ) {
          setIsModalVisible(false)

          let campusIds = await onChooseCampus()
          if (campusIds) {
          } else campusIds = []

          let suggestedGifts = await onChooseSuggestedGift()
          if (suggestedGifts) {
          } else suggestedGifts = []
          setLoading(true)
          const {
            success,
            message: errorMessage,
            data,
          } = await createTithingFund({
            fund: {
              image: avatar.src!,
              name: values.name,
              description: values.description,
              currency: values.defaultCurrency,
              campusIds,
              suggestions: suggestedGifts,
            },
          })
          if (!success || !data) {
            console.error('create fund Error: ', errorMessage)
            message.error(t('error-server'))
            return
          }
          message.success(t('giving.fund-created'))
          router.push({
            pathname: `/tithing/${data.id}`,
          })
        }
      } else if (fund && mode === 'edit' && onChooseSuggestedGift) {
        setIsModalVisible(false)
        let suggestedGifts = await onChooseSuggestedGift()
        setLoading(true)
        if (suggestedGifts) {
        } else suggestedGifts = []
        const {
          success,
          message: errorMessage,
          isAuth,
        } = await updateTithingFun({
          fund: {
            id: fund.id,
            image: avatar.src,
            name: values.name,
            description: values.description,
            suggestions: suggestedGifts,
          },
        })
        if (!success && !isAuth) {
          console.error('update fund Error: ', errorMessage)
          message.error(t('error-server'))
          return
        }
        message.success(t('giving.fund-updated'))
        callbackUpdated?.(true)
      }
    } finally {
      handleCancel()
    }
  }

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

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
        <H5>
          {mode === 'create'
            ? t('giving.create-tithing-fund-title')
            : t('giving.update-tithing-fund-title')}
        </H5>
        <div className="mt-6">
          <Avatar
            shape="square"
            src={avatar?.src}
            onImage={onImage}
            size={107}
            randomAvatar={mode === 'create' && !avatar.src}
            uploadable
          />
        </div>

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
            name="name"
            label={<Text strong>{t('giving.tithing-fund-name')}</Text>}
            initialValue={''}
          >
            <Input placeholder={t('giving.enter-fund-name')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<Text strong>{t('giving.tithing-fund-description')}</Text>}
            initialValue={''}
          >
            <TextArea
              placeholder={t('giving.enter-fund-description')}
              rows={4}
            />
          </Form.Item>
          <Form.Item
            name="defaultCurrency"
            label={<Text strong>{t('giving.default-currency')}</Text>}
            initialValue={''}
          >
            <Select
              disabled={mode === 'edit'}
              options={currencies}
              onChange={(currentCurrenciesGiving: string) =>
                handleChangeCurrency(currentCurrenciesGiving)
              }
              placeholder="Default Currency"
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ span: 24, offset: 2, sm: { span: 20, offset: 7 } }}
            shouldUpdate
          >
            {() => {
              const name = form.getFieldValue('name')
              const description = form.getFieldValue('description')
              const defaultCurrency = form.getFieldValue('defaultCurrency')
              const validate = [
                name,
                description,
                avatar.src,
                defaultCurrency,
              ].every(Boolean)
              return (
                <Button
                  disabled={!validate || loading}
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

export default forwardRef(CreateTithingFundModal)
