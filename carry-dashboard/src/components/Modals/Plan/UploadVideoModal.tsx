import Button from '@components/Button'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import { H5, Text } from '@components/Typography'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { VideoAct } from '@dts/Plans'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
  useRef,
} from 'react'
import Input from '@components/Input'
import UploadFile from '@components/UploadFile'
import { UploadFile as AntdUploadFile, message, Spin } from 'antd'
import { uploadVideo } from '@shared/Utils'

type Props = {}

export type UploadVideoModalRef = {
  show: (initAct?: VideoAct) => Promise<VideoAct | undefined>
}

const UploadVideoModal: ForwardRefRenderFunction<UploadVideoModalRef, Props> = (
  {},
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [video, setVideo] = useState<AntdUploadFile>()
  const [spinning, setSpinning] = useState(false)

  const resolveRef = useRef<((act?: VideoAct) => void) | null>(null)

  const onVideo = (video?: AntdUploadFile) => {
    setVideo(video)
  }

  const [form] = Form.useForm()

  const { t } = useTranslation()

  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('title', initAct.title)
        onVideo({
          uid: '-1',
          status: 'done',
          url: initAct.url,
          name: decodeURIComponent(
            initAct?.url?.split('/').pop()?.split('?')?.[0] ?? ''
          ),
        })
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
    setVideo(undefined)
  }

  const onFinish = async ({ title }: { title: string }) => {
    if (!video?.url) {
      setSpinning(true)
      const uploadUrl = await uploadVideo(video)
      setSpinning(false)
      if (uploadUrl === undefined) {
        message.error('File upload must be video')
      } else {
        resolveRef.current?.({
          type: 'video',
          service: 'web',
          title: title,
          url: uploadUrl,
          vertical: true,
        })
        handleCancel()
      }
    } else {
      handleCancel()
    }
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
        <H5>{t('plans.upload-video-title')}</H5>
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
          <Form.Item name="video">
            <div className="pb-2">
              <Text strong>{'Video file (Must be filmed vertically)'}</Text>
            </div>
            <Spin className={classNames('-translate-y-6')} spinning={spinning}>
              <UploadFile initVideo={video} onVideo={onVideo} />
            </Spin>
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
                  disabled={!form.getFieldValue('title') || !video || spinning}
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

export default forwardRef(UploadVideoModal)
