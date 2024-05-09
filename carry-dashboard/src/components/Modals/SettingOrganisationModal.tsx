import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Select from '@components/Select'
import { H5 } from '@components/Typography'
import { User } from '@dts/User'
import useOrganisationData from '@hooks/useOrganisationData'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateMe } from '@redux/slices/me'
import {
  fetchDashboardAccount,
  updateDefaultOrganisation,
} from '@shared/Firebase/account'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'

type Props = {}

export type SettingOrganisationModalRef = {
  show: () => void
}

const SettingOrganisationModal: ForwardRefRenderFunction<
  SettingOrganisationModalRef,
  Props
> = ({}, ref) => {
  const [form] = Form.useForm()
  const route = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const me = useAppSelector((state) => state.me)
  const { organisationData } = useOrganisationData()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const dispatch = useAppDispatch()

  const show = useCallback(() => {
    form.resetFields()
    setIsModalVisible(true)
  }, [form])

  const hide = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  useImperativeHandle(ref, () => ({
    show,
  }))

  const handleCancel = () => {
    form.resetFields()
    hide()
    setLoading(false)
  }

  const options = useMemo(() => {
    if (me.isGM && organisationData) {
      let orgOption = organisationData.map((i) => ({
        key: i.id,
        label: i.name ? i.name + (' - ' + (i.id ?? '')) : i.id,
        value: i.id,
      }))
      orgOption = orgOption.filter((x) => x.key)
      return orgOption
    }
    return []
  }, [me.isGM, organisationData])

  const onFinish = async (values: { orgSelect?: string }) => {
    setLoading(true)
    if (!values.orgSelect) {
      message.error(t('select-organisation'))
      setLoading(false)
      return
    }
    const { success, message: errorMessage } = await updateDefaultOrganisation(
      values.orgSelect
    )

    if (!success) {
      console.error('update organisation fail: ', errorMessage)
      message.error(t('error-server'))
      return
    }
    const userInfo = await fetchDashboardAccount()
    dispatch(
      updateMe({
        uid: userInfo.uid,
        email: userInfo?.email,
        image: userInfo?.image,
        name: userInfo?.name,
        campusAccess: userInfo?.campusAccess,
        permission: userInfo?.permissions,
        organisation: userInfo?.organisation,
      } as User)
    )

    setLoading(false)
    message.success(t('user-updated'))
    hide()
    route.push('/')
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
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5 className="text-center">{t('select-organisation-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item name="orgSelect">
            <Select
              options={options}
              placeholder={t('enter-the-organisation')}
              showSearch={true}
              filterOption={(input, option) => {
                const optionString = (
                  option?.label?.toString() ?? ''
                ).toLocaleLowerCase()
                const searchText = (input ?? '').toLocaleLowerCase()
                return optionString.includes(searchText)
              }}
              filterSort={(optionA, optionB) =>
                (optionA?.label?.toString() ?? '')
                  .toLowerCase()
                  .localeCompare(
                    (optionB?.label?.toLocaleString() ?? '').toLowerCase()
                  )
              }
              defaultValue={me.defaultGMAccess ?? ''}
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                disabled={!form.getFieldValue('organisation') && !me.isGM}
                className="w-1/2"
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {t('continue')}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(SettingOrganisationModal)
