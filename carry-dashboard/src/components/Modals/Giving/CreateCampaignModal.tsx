import _ from 'lodash'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { Form, message, Modal } from 'antd'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import Upload from 'antd/lib/upload/Upload'

import { H5, Text } from '@components/Typography'
import Button from '@components/Button'
import Input from '@components/Input'
import { GoalAmount } from '@components/Modals/Giving/SetGoalAmountCampaignModal'
import { getRandomImage } from '@shared/Unsplash'
import { createCampaign, updateCampaign } from '@shared/Firebase/campaign'
import { Campaign } from '@dts/Campaign'
import { resizeImage } from '@shared/Utils'
import useGlobalLoading from '@hooks/useGlobalLoading'

import IcXCircle from '@assets/icons/XCircleIcon.svg'
import TextArea from '@components/Input/TextArea'

type Props = {
  onChooseSuggestedGift?: (
    suggestions?: number[]
  ) => Promise<number[] | undefined>
  onSetGoalAmount?: (goal?: number, currency?: string) => Promise<GoalAmount>
  onFinish: (id: string) => void
}

export type CreateCampaignModalRef = {
  show: (mode: 'create' | 'edit', campaign?: Campaign) => void
}

const CreateCampaignModal: ForwardRefRenderFunction<
  CreateCampaignModalRef,
  Props
> = ({ onChooseSuggestedGift, onSetGoalAmount, onFinish }, ref) => {
  const { t } = useTranslation()

  const { startLoading, stopLoading } = useGlobalLoading()

  const [loading, setLoading] = useState<boolean>(false)

  const [isShowModal, setIsShowModal] = useState<boolean>(false)

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [campaign, setCampaign] = useState<Campaign | null>()
  const [isValid, setValid] = useState(false)

  const [image, setImage] = useState<string>()

  const [form] = Form.useForm()

  useImperativeHandle(
    ref,
    () => ({
      show: (mode, campaign) => {
        setIsShowModal(true)
        setMode(mode)

        if (mode === 'edit' && !_.isNil(campaign)) {
          setCampaign(campaign)
          setImage(campaign.image)
          setValid(true)
        }
      },
    }),
    []
  )

  useEffect(() => {
    const getRandImage = async () => {
      const url = await getRandomImage('nature')

      if (!_.isNil(url)) {
        setImage(url.urls.regular)
      }
    }

    if (!_.isNil(campaign)) {
      setImage(campaign.image)

      form.setFieldValue('name', campaign.name)
      form.setFieldValue('description', campaign.description)
    } else {
      getRandImage()
    }
  }, [campaign, form])

  useEffect(() => {
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, startLoading, stopLoading])

  const handleFormSubmit = async () => {
    setIsShowModal(false)

    const name = form.getFieldValue('name') as string
    const description = form.getFieldValue('description') as string

    if (mode === 'create') {
      const { goal, currency } = await onSetGoalAmount!()
      const suggestions = await onChooseSuggestedGift!()

      setLoading(true)

      const res = await createCampaign({
        image: image!,
        name,
        description,
        goal,
        currency,
        suggestions: suggestions || [],
      })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        message.success(t('giving.campaign-created'))

        onFinish(res.data!.id)
      }
    } else {
      if (_.isNil(campaign)) {
        return
      }

      const { goal, currency } = await onSetGoalAmount!(
        campaign.goalAmount,
        campaign.currency
      )
      const suggestions = await onChooseSuggestedGift!(
        campaign.suggestionAmounts
      )

      setLoading(true)

      const res = await updateCampaign({
        id: campaign.id!,
        image: image!,
        name,
        description,
        goal,
        currency,
        suggestions: suggestions || [],
      })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        message.success(res.message!)
        onFinish(campaign.id)
      }
    }
  }

  const onFilePicked = async (file: any) => {
    const base64 = (await resizeImage(file, 500, 500)) as string

    setImage(base64)
  }

  const handleCancel = () => {
    setIsShowModal(false)

    setCampaign(null)

    form.resetFields()
  }

  const checkValid = () => {
    const name = form.getFieldValue('name')
    const description = form.getFieldValue('description')
    setValid([name, description].every(Boolean))
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
        <H5>{t('giving.create-campaign')}</H5>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <div className="ml-10 flex flex-col items-center py-5 sm:ml-0">
            <div className="relative aspect-video w-full max-w-[200px] sm:max-w-sm">
              {image && (
                <Image
                  src={image}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              )}
            </div>
            <div className="my-4">
              <Upload
                customRequest={(opts) => {
                  onFilePicked(opts.file)
                }}
                className="mt-3"
                showUploadList={false}
                accept="image/*"
              >
                <Text className="text-primary">Change campaign image</Text>
              </Upload>
            </div>
          </div>
          <Form.Item name="name" label={<Text>Campaign name</Text>}>
            <Input placeholder="Enter campaign name" onChange={checkValid} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<Text>Campaign description</Text>}
          >
            <TextArea
              placeholder="Enter campaign description"
              onChange={checkValid}
              rows={4}
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
            <Button
              loading={false}
              disabled={!isValid}
              className="w-full sm:w-1/2"
              type="primary"
              htmlType="submit"
            >
              {t('continue')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(CreateCampaignModal)
