import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { VideoAct } from '@dts/Plans'
import { getYoutubeVideoId } from '@shared/Utils'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {}

export type AddYoutubeVideoModalRef = {
  show: (initAct?: VideoAct) => Promise<VideoAct | undefined>
}

const AddYoutubeVideoModal: ForwardRefRenderFunction<
  AddYoutubeVideoModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((act?: VideoAct) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('title', initAct.title)
        form.setFieldValue('description', initAct.description)
        form.setFieldValue('link', `https://youtu.be/${initAct.videoId}`)
      }
      return new Promise<VideoAct | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onFinish = async ({
    title,
    description,
    link,
  }: {
    title: string
    description: string
    link: string
  }) => {
    resolveRef.current?.({
      type: 'video',
      service: 'youtube',
      title,
      description,
      videoId: getYoutubeVideoId(link)!,
    })
    handleCancel()
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
        <H5>{t('plans.add-youtube-video-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="title"
            label={<Text strong>{t('plans.video-title')}</Text>}
          >
            <Input placeholder={t('plans.enter-video-title')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<Text strong>{t('plans.video-description')}</Text>}
          >
            <Input placeholder={t('plans.enter-video-description')} />
          </Form.Item>
          <Form.Item
            name="link"
            label={<Text strong>{t('plans.youtube-link')}</Text>}
            rules={[
              {
                validator: async (rule, link) => {
                  const videoId = getYoutubeVideoId(link)
                  if (!videoId) {
                    throw new Error(t('plans.invalid-youtube-url'))
                  }
                },
              },
            ]}
          >
            <Input placeholder={t('plans.paste-youtube-link')} />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => {
              return (
                <Button
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !form.getFieldValue('title') ||
                    !form.getFieldValue('description') ||
                    !form.getFieldValue('link') ||
                    form.getFieldsError().filter(({ errors }) => errors.length)
                      .length > 0
                  }
                >
                  {t('done')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddYoutubeVideoModal)
