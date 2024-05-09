import { getRandomImage } from '@shared/Unsplash'
import { resizeImage } from '@shared/Utils'
import { AvatarProps, Spin, Upload } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import MemberAvatar from './MemberAvatar'

import { Text } from './Typography'

export type ChooseImageType = {
  src?: string
  type?: 'unsplash' | 'gallery' | ''
}

interface Props extends AvatarProps {
  uploadable?: boolean
  isStatic?: boolean
  randomAvatar?: boolean
  onImage: (img: ChooseImageType) => void
  title?: string
  loading?: boolean
}

const Avatar: React.FC<Props> = ({
  uploadable = false,
  onImage,
  randomAvatar = false,
  src,
  title,
  loading = false,
  ...props
}) => {
  const { t } = useTranslation()
  const [spinning, setSpinning] = useState(false)
  const [img, setImg] = useState<any>('')
  const onClickChangeAvatar = () => {}

  useEffect(() => {
    const getRandomAvatar = async () => {
      setSpinning(true)
      const image = await getRandomImage('nature')
      setImg(image?.urls.regular || '')
      setSpinning(false)
      onImage({ src: image?.urls.regular, type: 'unsplash' })
    }
    if (randomAvatar) getRandomAvatar()
    else setImg(src)
  }, [onImage, randomAvatar, uploadable, src])

  const customRequest = async (options: any) => {
    setSpinning(true)
    const base64 = (await resizeImage(options.file, 500, 500)) as string

    setImg(base64)
    onImage({ src: base64, type: 'gallery' })
    setSpinning(false)
  }

  return (
    <div className={classNames(props.className)}>
      <Spin
        className={classNames('-translate-y-6', props.className)}
        spinning={spinning || loading}
      >
        <div className={classNames('flex flex-col items-center')}>
          <MemberAvatar
            src={img}
            size={props.size}
            alt={props.alt}
            shape={props.shape}
          />
          {uploadable ? (
            <Upload
              customRequest={customRequest}
              className="mt-3"
              showUploadList={false}
              accept="image/*"
            >
              <Text
                onClick={onClickChangeAvatar}
                className="cursor-pointer text-primary"
              >
                {title ?? t('change-avatar')}
              </Text>
            </Upload>
          ) : null}
        </div>
      </Spin>
    </div>
  )
}

export default Avatar
