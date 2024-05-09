import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { User } from '@dts/User'
import { DEFAULT_USER_AVATAR } from '@shared/Constants'
import { updateMemberProfile } from '@shared/Firebase/member'
import { uploadBase64Image } from '@shared/Firebase/storage'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  userInfo: User
  onUpdateUserInfo?: () => void
}

export type EditUserModalRef = {
  show: () => void
}

const EditUserModal: ForwardRefRenderFunction<EditUserModalRef, Props> = (
  { userInfo, onUpdateUserInfo },
  ref
) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const [avatar, setAvatar] = useState<ChooseImageType>({
    src: userInfo?.image || DEFAULT_USER_AVATAR,
    type: '',
  })
  const [isModalVisible, setModalVisble] = useState(false)

  const show = useCallback(() => {
    form.resetFields()
    setModalVisble(true)
  }, [form])

  const hide = useCallback(() => {
    setModalVisble(false)
  }, [])

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    hide()
    setLoading(false)
  }

  const onFinish = async (values: {
    name?: string
    emailAddress?: string
    phoneNumber?: string
    location?: string
  }) => {
    setLoading(true)
    let image = avatar.src
    if (avatar.type === 'gallery' && avatar.src) {
      image = await uploadBase64Image(
        userInfo.uid,
        'images',
        `avatar`,
        avatar.src
      )
    }
    const { success, message: errorMessage } = await updateMemberProfile(
      userInfo!.uid,
      {
        name: values.name,
        email: values.emailAddress,
        phoneNumber: values.phoneNumber,
        address: values.location,
        image,
      }
    )

    if (!success) {
      console.error('update Member Profile Error: ', errorMessage)
      message.error(t('error-server'))
      return
    }

    await onUpdateUserInfo?.()
    setLoading(false)
    message.success(t('user-updated'))
    hide()
  }

  if (!userInfo) {
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
        <H5>{t('members.edit-your-profile')}</H5>
        <Avatar
          className="mt-6"
          src={avatar.src}
          alt={'User avatar'}
          size={107}
          onImage={onImage}
          uploadable
          title={t('members.change-profile-image')}
        />
        {/* <Text className="mt-3" strong>
          {userInfo.name}
        </Text> */}
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
            label={<Text strong>{t('members.name')}</Text>}
            initialValue={userInfo.name}
          >
            <Input placeholder={t('members.enter-name')} />
          </Form.Item>
          <Form.Item
            name="emailAddress"
            label={<Text strong>{t('members.email-address')}</Text>}
            initialValue={userInfo.email}
          >
            <Input placeholder={t('members.enter-email-address')} disabled />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label={<Text strong>{t('members.phone-number')}</Text>}
            initialValue={userInfo.phoneNumber}
          >
            <Input placeholder={t('members.enter-phone-number')} />
          </Form.Item>
          <Form.Item
            name="location"
            label={<Text strong>{t('members.location')}</Text>}
            initialValue={userInfo.address}
          >
            <Input placeholder={t('members.enter-location')} />
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

export default forwardRef(EditUserModal)
