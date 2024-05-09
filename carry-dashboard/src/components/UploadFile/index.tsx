import {
  Button,
  Col,
  message,
  Row,
  Spin,
  Upload as AntdUpload,
  UploadFile as AntdUploadFile,
  UploadProps,
} from 'antd'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import UploadIcon from '@assets/icons/UploadIcon.svg'
import Image from 'next/image'
import { Text } from '@components/Typography'
import { useTranslation } from 'next-i18next'
import {
  generateVideoThumbnails,
  generateVideoThumbnailViaUrl,
} from '@rajesh896/video-thumbnails-generator'
import X from '@assets/icons/xLine.svg'

export interface UploadFileProps extends UploadProps {
  onVideo: (video?: AntdUploadFile) => void
  initVideo?: AntdUploadFile
}

export interface PreviewVideoProps extends UploadProps {
  file?: AntdUploadFile
  removeVideo?: () => void
}

const PreviewVideo = (props: PreviewVideoProps) => {
  const [thumbnail, setThumbnail] = useState<string>('')

  useEffect(() => {
    if (!props.file?.url && props.file?.status === 'done') {
      return props?.removeVideo?.()
    }

    setThumbnail('')
    if (props.file?.url) {
      generateVideoThumbnailViaUrl(props.file?.url, 1)
        .then((thumbs) => {
          setThumbnail(thumbs)
        })
        .catch(() => {
          setThumbnail('')
        })
    } else {
      generateVideoThumbnails(props.file as any, 1, '').then((thumbs) => {
        setThumbnail(thumbs[0])
      })
    }
  }, [props, props.file])

  return (
    <div
      className={classNames(
        'rounded-xl border-[1px] border-solid border-primary',
        'flex w-52 flex-1 flex-col items-center justify-between'
      )}
    >
      <div className="pb-2 pt-3">
        {thumbnail ? (
          <Image
            src={thumbnail}
            objectFit="contain"
            alt="thumbnail-image"
            width={129}
            height={200}
          />
        ) : (
          <Spin />
        )}
      </div>
      <div className="flex w-52 flex-row items-center border-0 border-t-[1px] border-solid border-primary p-2">
        <Text strong ellipsis={true} className={classNames('w-48 py-1 pl-2')}>
          {props.file?.name}
        </Text>
        <Button
          type="text"
          onClick={props.removeVideo}
          className="h-13 p-0 py-1"
        >
          <Image
            alt="close-icon"
            src={X}
            width={25}
            height={25}
            objectFit="contain"
          />
        </Button>
      </div>
    </div>
  )
}

const UploadFile = (props: UploadFileProps) => {
  const { className, ...nest } = props
  const { t } = useTranslation()
  const [videoFile, setVideoFile] = useState<AntdUploadFile>()

  const beforeUpload = async (file: AntdUploadFile) => {
    const isVideo = file.type?.includes('video')
    if (!isVideo) {
      message.error(`${file.name} is not a video file`)
    } else {
      setVideoFile(file)
      props.onVideo(file)
    }
    return isVideo
  }

  return (
    <AntdUpload.Dragger
      {...nest}
      name="upload-file"
      listType="picture"
      showUploadList={false}
      beforeUpload={beforeUpload}
      className={classNames('py-7', className)}
      accept="video/*"
      customRequest={() => {}}
      maxCount={1}
      defaultFileList={props.initVideo ? [props.initVideo] : []}
      disabled={!!((videoFile && videoFile.name) || props.initVideo)}
    >
      {(videoFile && videoFile.name) || props.initVideo ? (
        <Row gutter={[16, 16]} className="flex justify-center px-6">
          <Col span={12} key={videoFile?.name || props.initVideo?.name}>
            <PreviewVideo
              file={videoFile || props.initVideo}
              removeVideo={() => {
                setVideoFile(undefined)
                props.onVideo(undefined)
              }}
            />
          </Col>
        </Row>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <Image src={UploadIcon} alt="close-icon" width={80} height={80} />
          <Text className="ant-upload-hint">
            <Text strong className="text-primary">
              {t('plans.choose-file')}
            </Text>
            {` ${t('plans.or-drag-here')}`}
          </Text>
        </div>
      )}
    </AntdUpload.Dragger>
  )
}

export default UploadFile
