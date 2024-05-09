import { Form, message, Modal } from 'antd'
import { useTranslation } from 'next-i18next'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Image from 'next/image'
import { H5, Text } from '@components/Typography'
import classNames from 'classnames'
import Button from '@components/Button'
import Input from '@components/Input'
import { getRandomImage } from '@shared/Unsplash'

import Avatar, { ChooseImageType } from '@components/Avatar'
// import Select from '@components/Select'
import {
  Campus,
  createCampus,
  CreateCampusResp,
  updateCampus,
} from '@shared/Firebase/campus'
import { uploadBase64Image } from '@shared/Firebase/storage'
import { useAppSelector } from '@redux/hooks'

type Props = {
  onUpdate?: () => void
}

export type CampusCreationModalRef = {
  show: (campus?: Campus) => void
}

const CampusCreationModal: ForwardRefRenderFunction<
  CampusCreationModalRef,
  Props
> = (props, ref) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)

  const [mode, setMode] = useState<'create' | 'update'>('create')
  const [loading, setLoading] = useState(false)
  const [updateCampusInfo, setUpdateCampusInfo] = useState<Campus | undefined>()
  const me = useAppSelector((state) => state.me)

  const [avatar, setAvatar] = useState<ChooseImageType>({ src: '', type: '' })
  const [loadingAvatar, setLoadingAvatar] = useState(false)

  const show = (campus?: Campus) => {
    setIsModalVisible(true)
    if (campus) {
      setMode('update')
      setUpdateCampusInfo(campus)
      setAvatar({ src: campus.image })
      form.resetFields()
    } else {
      form.resetFields()
      setMode('create')
      getAvatar()
    }
  }

  useImperativeHandle(ref, () => ({
    show,
  }))

  const getAvatar = async () => {
    setLoadingAvatar(true)
    const image = await getRandomImage('nature')
    setAvatar({ src: image?.urls.regular || '', type: 'unsplash' })
    setLoadingAvatar(false)
  }

  const handleCancel = () => {
    form.resetFields()
    setLoading(false)
    setIsModalVisible(false)
    setUpdateCampusInfo(undefined)
  }

  const onFinish = async (values: {
    campusName: string
    city: string
    country: string
    region: string
    state: string
  }) => {
    if (!values.campusName || values.campusName.length < 5) {
      return message.error(t('errors.campus-name-not-valid'))
    }

    setLoading(true)
    let image = avatar.src
    if (avatar.type === 'gallery' && avatar.src) {
      image = await uploadBase64Image(
        me.uid,
        'images',
        `campusAvatar${Date.now()}`,
        avatar.src
      )
    }
    let resp: CreateCampusResp = { success: false, message: '' }
    if (mode === 'create') {
      resp = await createCampus({
        name: values.campusName,
        avatar: image,
        city: values.city,
        country: values.country,
        region: values.region,
        state: values.state,
      })
    } else {
      resp = await updateCampus({
        id: updateCampusInfo?.id,
        name: values.campusName,
        avatar: image,
        city: values.city,
        country: values.country,
        region: values.region,
        state: values.state,
      })
    }
    setLoading(false)
    handleCancel()
    if (resp.success) {
      if (mode === 'create') message.success(t('campuses.campus-created'))
      if (mode === 'update') message.success(t('campuses.campus-updated'))
    } else {
      message.error(resp.message)
    }
    await props.onUpdate?.()
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
        <H5>{t('campuses.create-a-campus')}</H5>

        <Avatar
          loading={loadingAvatar}
          src={avatar?.src}
          onImage={onImage}
          size={107}
          uploadable
          className="mt-6"
        />

        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 w-full px-2 sm:mr-0 sm:px-8"
          layout="vertical"
          labelCol={{ span: 14 }}
          wrapperCol={{ span: 24 }}
          disabled={loading}
        >
          <Form.Item
            name="campusName"
            label={<Text strong>{t('campuses.campus-name-field')}</Text>}
            required
            initialValue={updateCampusInfo?.name}
          >
            <Input placeholder={t('campuses.enter-campus-name')} />
          </Form.Item>

          <div className="flex w-full flex-row space-x-4">
            <div className="flex-1">
              <Form.Item
                name="city"
                label={<Text strong>{t('campuses.city')}</Text>}
                initialValue={updateCampusInfo?.city}
              >
                <Input placeholder={t('campuses.enter-city')} />
              </Form.Item>
            </div>
            <div className="flex-1">
              <Form.Item
                name="state"
                label={<Text strong>{t('campuses.state')}</Text>}
                initialValue={updateCampusInfo?.state}
              >
                <Input placeholder={t('campuses.enter-state')} />
              </Form.Item>
            </div>
          </div>
          <Form.Item
            name="country"
            label={<Text strong>{t('campuses.country')}</Text>}
            initialValue={updateCampusInfo?.country}
          >
            <Input placeholder={t('campuses.enter-a-country')} />
          </Form.Item>
          <Form.Item
            name="region"
            label={<Text strong>{t('campuses.region')}</Text>}
            initialValue={updateCampusInfo?.region}
          >
            <Input placeholder={t('campuses.enter-a-region')} />
            {/* <Select
              options={[{ key: '1', label: 'VietNam', value: 'vietnam' }]}
              placeholder={t('campuses.enter-a-region')}
            /> */}
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
            <Button
              loading={loading}
              disabled={loading}
              className="w-1/2"
              type="primary"
              htmlType="submit"
            >
              {mode === 'update' ? t('update') : t('finish')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(CampusCreationModal)
