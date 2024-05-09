import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'
import { Modal } from 'antd'
import Image from 'next/image'
import Plyr from 'plyr-react'

import { H5 } from '@components/Typography'
import { CampaignVideo, CampaignVideoType } from '@dts/Campaign'

import IcXCircle from '@assets/icons/XCircleIcon.svg'

type Props = {
  video: CampaignVideo
}

export type PreviewCampaignVideoModalRef = { show: () => void }

const PreviewCampaignVideoModal: ForwardRefRenderFunction<
  PreviewCampaignVideoModalRef,
  Props
> = (props, ref) => {
  const [isShowModal, setIsShowModal] = useState<boolean>(false)

  const show = () => {
    setIsShowModal(true)
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  return (
    <Modal
      closable
      visible={isShowModal}
      onCancel={() => setIsShowModal(false)}
      closeIcon={<Image src={IcXCircle} alt="" width={22} height={22} />}
      footer={null}
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
      destroyOnClose={true}
    >
      <div className="flex flex-col items-center">
        <H5>{props.video.title}</H5>
        <div className="mt-6 w-full">
          <Plyr
            autoPlay
            source={{
              type: 'video',
              sources: [
                {
                  src: props.video.url,
                  provider:
                    props.video.videoOption === CampaignVideoType.youtube ||
                    props.video.type === CampaignVideoType.youtube
                      ? 'youtube'
                      : 'html5',
                },
              ],
            }}
          />
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(PreviewCampaignVideoModal)
