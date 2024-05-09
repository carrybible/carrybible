import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import useOrganisationInfo from '@hooks/useOrganisationInfo'
import { DEFAULT_USER_AVATAR } from '@shared/Constants'
import { updateOrganisationDetails } from '@shared/Firebase/account'
import { uploadBase64Image } from '@shared/Firebase/storage'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onUpdateOrganisationInfo?: () => void
}

export type EditOrganisationModalRef = {
  show: () => void
}

const EditOrganisationModal: ForwardRefRenderFunction<
  EditOrganisationModalRef,
  Props
> = ({}, ref) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const { organisationInfo } = useOrganisationInfo()

  const [avatar, setAvatar] = useState<ChooseImageType>({
    src: DEFAULT_USER_AVATAR,
    type: '',
  })

  const [isModalVisible, setIsModalVisible] = useState(false)

  const show = useCallback(() => {
    if (organisationInfo?.image) {
      setAvatar({ src: organisationInfo.image })
    }
    form.resetFields()
    setIsModalVisible(true)
  }, [form, organisationInfo])

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    setLoading(false)
    setIsModalVisible(false)
  }

  useEffect(() => {
    if (organisationInfo?.image) {
      setAvatar({ ...avatar, src: organisationInfo.image })
    }
  }, [organisationInfo])

  const onFinish = async (values: { name?: string }) => {
    try {
      if (organisationInfo?.id) {
        setLoading(true)
        let image = avatar.src
        if (avatar.type === 'gallery' && avatar.src) {
          image = await uploadBase64Image(
            organisationInfo?.id,
            'images',
            `avatar`,
            avatar.src
          )
        }
        setLoading(true)
        if (!values.name) {
          message.error(t('organisation.enter-ministry-organization-name'))
          setLoading(false)
          return
        } else {
          if (image) {
            const { success, message: errorMessage } =
              await updateOrganisationDetails(
                organisationInfo?.id,
                image,
                values.name
              )

            if (!success) {
              console.error('update organisation fail: ', errorMessage)
              message.error(t('error-server'))
              return
            }

            setLoading(false)
            message.success(t('organisation.organisation-updated'))
          }
        }
      }
    } finally {
      setLoading(false)
      handleCancel()
    }
  }

  if (!organisationInfo) {
    return null
  }

  const onImage = (img: ChooseImageType) => {
    setAvatar(img)
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
      destroyOnClose={true}
    >
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5>{t('organisation.edit-your-ministry-title')}</H5>
        <Avatar
          className="mt-6"
          src={avatar.src}
          alt={'User avatar'}
          size={107}
          uploadable={true}
          onImage={onImage}
          title={t('change-avatar')}
        />
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-10/12 sm:mr-0 sm:w-full"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
          disabled={loading}
        >
          <Form.Item
            name="name"
            label={
              <Text strong>{t('organisation.ministry-organization-name')}</Text>
            }
            initialValue={organisationInfo?.name}
          >
            <Input
              placeholder={t('organisation.enter-ministry-organization-name')}
            />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
            <Button
              className="w-1/2"
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {t('update')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(EditOrganisationModal)
