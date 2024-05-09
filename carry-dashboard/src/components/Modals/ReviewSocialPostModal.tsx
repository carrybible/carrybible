import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import { Text } from '@components/Typography'
import { SocialMediaPost } from '@dts/Group'
import { Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import Plyr from 'plyr-react'
import 'plyr-react/plyr.css'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { H4 } from '../Typography/Headline'

type Props = {}

export type ReviewSocialPostModalRef = {
  show: (plan: SocialMediaPost) => void
}

const ReviewSocialPostModal: ForwardRefRenderFunction<
  ReviewSocialPostModalRef,
  Props
> = ({}, ref) => {
  const { t } = useTranslation()
  const videoRef = useRef<any>()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [post, setPost] = useState<SocialMediaPost | null>(null)
  const [loading, setLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    show: (newPlan: SocialMediaPost) => {
      setPost(newPlan)
      setIsModalVisible(true)
    },
  }))

  const handleCancel = () => {
    setPost(null)
    setIsModalVisible(false)
    setLoading(false)
  }

  const onClickDownload = async () => {
    //TODO
    videoRef.current?.plyr?.pause()
    window.open(post?.videoUrl, '_blank', 'noreferrer')
  }

  if (!post) return null

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
        <H4>{t('group.share-your-plan')}</H4>
        <Text>{t('group.click-below-to-download')}</Text>
        <div className="mt-6 w-full">
          <Plyr
            ref={videoRef}
            autoPlay
            source={{
              type: 'video',
              sources: [
                {
                  src: post.videoUrl,
                  provider: (post.videoUrl || '')
                    .toLowerCase()
                    .includes('youtube')
                    ? 'youtube'
                    : 'html5',
                },
              ],
            }}
          />
        </div>
        <Button
          onClick={onClickDownload}
          loading={loading}
          className="mt-10 w-1/2"
          type="primary"
          htmlType="submit"
        >
          {t('download')}
        </Button>
      </div>
    </Modal>
  )
}

export default forwardRef(ReviewSocialPostModal)
