import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { DEFAULT_USER_AVATAR } from '@shared/Constants'
import { MemberProfileType, updateMemberProfile } from '@shared/Firebase/member'
import { uploadBase64Image } from '@shared/Firebase/storage'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { omit } from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  userInfo: MemberProfileType
  queryKey: string
  onUpdateUserInfo?: () => void
}

export type EditMemberModalRef = {
  show: () => void
}

const EditMemberModal: ForwardRefRenderFunction<EditMemberModalRef, Props> = (
  { userInfo, onUpdateUserInfo, queryKey },
  ref
) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const router = useRouter()
  const [avatar, setAvatar] = useState<ChooseImageType>({
    src: userInfo?.image || DEFAULT_USER_AVATAR,
    type: '',
  })
  const isModalVisible = router.query[queryKey] === 'true'
  const isViewMode = queryKey === 'detail'

  const show = useCallback(() => {
    form.resetFields()
    router.replace(
      {
        query: {
          ...router.query,
          [queryKey]: true,
        },
      },
      undefined,
      {
        shallow: true,
      }
    )
  }, [form, queryKey, router])

  const hide = useCallback(() => {
    router.replace(
      {
        query: omit(router.query, [queryKey]),
      },
      undefined,
      {
        shallow: true,
      }
    )
  }, [queryKey, router])

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
      <div className={classNames('items-center', 'flex flex-col')}>
        <H5>{t('members.edit-member-details')}</H5>
        <Avatar
          className="mt-6"
          src={avatar.src}
          alt={'User avatar'}
          size={107}
          onImage={onImage}
          uploadable={!isViewMode}
          title={t('members.change-profile-image')}
        />
        {/* <Text className="mt-3" strong>
          {userInfo.name}
        </Text> */}
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
            label={<Text strong>{t('members.name')}</Text>}
            initialValue={userInfo.name}
          >
            <Input
              placeholder={t('members.enter-name')}
              disabled={isViewMode}
            />
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
            <Input
              placeholder={t('members.enter-phone-number')}
              disabled={isViewMode}
            />
          </Form.Item>
          <Form.Item
            name="location"
            label={<Text strong>{t('members.location')}</Text>}
            initialValue={userInfo.address}
          >
            <Input
              placeholder={t('members.enter-location')}
              disabled={isViewMode}
            />
          </Form.Item>
          {!isViewMode ? (
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
          ) : (
            <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
              <Button
                className="w-1/2"
                type="primary"
                loading={loading}
                onClick={() => hide()}
              >
                {t('Close')}
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(EditMemberModal)
