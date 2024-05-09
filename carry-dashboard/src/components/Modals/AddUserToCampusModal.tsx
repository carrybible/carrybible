import XCircleIcon from '@assets/icons/XCircleIcon.svg'

import Button from '@components/Button'
import SearchCampuses from '@components/SearchCampuses'
import Select from '@components/Select'
import { H5, Text } from '@components/Typography'
import { inviteCampusRole } from '@shared/Constants'
import { CampusAccess, updateCampusAccess } from '@shared/Firebase/campus'
import { MemberProfileType } from '@shared/Firebase/member'

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
  userInfo: MemberProfileType
  onUpdate: () => void
}

export type AddUserToCampusModalRef = {
  show: (campusAccessInfo?: CampusAccess) => void
}

const AddUserToCampusModal: ForwardRefRenderFunction<
  AddUserToCampusModalRef,
  Props
> = ({ userInfo, onUpdate }, ref) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()

  const [isModalVisible, setModalVisble] = useState(false)
  const [campusAccessInfo, setCampusAccessInfo] = useState<CampusAccess>()

  const show = useCallback(
    (info?: CampusAccess) => {
      form.resetFields()
      setModalVisble(true)
      if (info) setCampusAccessInfo(info)
      else setCampusAccessInfo(undefined)
    },
    [form]
  )

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
    access?: 'view' | 'edit'
    campus: string
  }) => {
    // if (!values.access || !values.campus) return
    if (!values.campus) return
    setLoading(true)
    const { success, message: errorMsg } = await updateCampusAccess({
      campusId: campusAccessInfo?.campusId
        ? campusAccessInfo?.campusId
        : values.campus,
      permission: values?.access ?? 'edit',
      userId: userInfo.uid,
    })
    setLoading(false)
    if (success) message.success(t('settings.plan-permission-added'))
    else message.error(errorMsg)
    onUpdate()
    hide()
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
        <H5>{t('campuses.add-campus-permission')}</H5>

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
            name="campus"
            label={<Text strong>{t('campuses.campus')}</Text>}
            initialValue={campusAccessInfo?.name}
          >
            <SearchCampuses
              placeholder={t('campuses.enter-campus-name')}
              disabled={campusAccessInfo?.name}
            />
          </Form.Item>
          <Form.Item
            name="access"
            label={<Text strong>{t('campuses.access')}</Text>}
            initialValue={campusAccessInfo?.permission}
            hidden={true}
          >
            <Select
              options={inviteCampusRole}
              placeholder={t('campuses.enter-an-access')}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
            <Button
              className="w-1/2"
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {t('done')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddUserToCampusModal)
