import Copy from '@assets/icons/Copy.svg'
import QrCode from '@assets/icons/QrCode.svg'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import { H5, Text } from '@components/Typography'
import { generateInviteLink } from '@shared/Firebase/group'
import { Form, message, Modal, Spin } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  groupId: string
  orgId?: string
  onPressDownload: () => void
}

export type ChooseAnInviteOptionModalRef = {
  show: () => void
  hide: () => void
}

type ChooseItemProps = {
  icon: 'QrCode' | 'Copy'
  title: string
  description: string
  highlightDescription?: boolean
  onClick: () => void
}

const ChooseItem: FC<ChooseItemProps> = (props) => {
  const [icons] = useState({ QrCode: QrCode, Copy: Copy })

  return (
    <div
      onClick={props.onClick}
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50 hover:cursor-pointer hover:!border-primary',
        'flex flex-row items-center',
        'mx-2 my-2 px-6 py-4',
        ' bg-neutral-10'
      )}
    >
      <div className="mr-8 flex min-w-[56px] justify-center">
        <Image
          src={icons[props.icon]}
          alt={props.icon}
          width={80}
          height={80}
          objectFit="cover"
        />
      </div>
      <div className={classNames('flex flex-col')}>
        <Text strong>{props.title}</Text>
        <Text
          className={props.highlightDescription ? '' : 'text-neutral-80'}
          style={props.highlightDescription ? { color: 'blue' } : {}}
        >
          {props.description}
        </Text>
      </div>
    </div>
  )
}

const ChooseAnInviteOptionModal: ForwardRefRenderFunction<
  ChooseAnInviteOptionModalRef,
  Props
> = ({ groupId, orgId, onPressDownload }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [form] = Form.useForm()
  const { t } = useTranslation()

  useEffect(() => {
    const run = async () => {
      if (isModalVisible) {
        setLoading(true)
        const inviteResult = await generateInviteLink(groupId, orgId)
        if (!inviteResult) {
          message.error(t('group.failed-to-generate-invite-link'))
          return
        }
        setInviteLink(inviteResult.link)
        setLoading(false)
      }
    }
    run()
  }, [groupId, isModalVisible, t])

  const show = () => {
    setIsModalVisible(true)
  }

  const hide = () => {
    setIsModalVisible(false)
  }

  useImperativeHandle(ref, () => ({
    show,
    hide,
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
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
      <Spin spinning={loading}>
        <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
          <H5>{t('group.choose-invite-option-title')}</H5>
          <Form
            form={form}
            className="mt-6 mr-10 w-full sm:mr-0"
            layout="vertical"
            labelCol={{ span: 14, offset: 2 }}
            wrapperCol={{ span: 20, offset: 2 }}
          >
            <Form.Item>
              <ChooseItem
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  message.success(t('group.link-copied'))
                  hide()
                }}
                icon="Copy"
                title={t('group.copy-invite-link')}
                description={inviteLink}
                highlightDescription
              />
            </Form.Item>

            <Form.Item>
              <ChooseItem
                onClick={onPressDownload}
                icon="QrCode"
                title={t('group.download-qr-code')}
                description={t('group.send-invite-link-via-text')}
              />
            </Form.Item>
          </Form>
        </div>
      </Spin>
    </Modal>
  )
}

export default forwardRef(ChooseAnInviteOptionModal)
