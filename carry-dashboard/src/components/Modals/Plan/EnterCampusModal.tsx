import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Select from '@components/Select'
import { H5 } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

type Props = {
  defaultCampus?: string
}

export type EnterCampusModalRef = {
  show: () => Promise<string | undefined>
}

const EnterCampusModal: ForwardRefRenderFunction<EnterCampusModalRef, Props> = (
  { defaultCampus },
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((days: string | undefined) => void) | null>(null)
  const me = useAppSelector((state) => state.me)
  const orgInfo = useAppSelector((state) => state.organisation.info)
  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<string | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    resolveRef.current = null
    setIsModalVisible(false)
  }

  const onFinish = async (values: { campus: string }) => {
    resolveRef.current?.(values.campus)
    handleCancel()
  }

  const options = useMemo(() => {
    if (me?.campusAccess) {
      let campusOption = me?.campusAccess?.map((i) => ({
        key: i.id,
        label: i.name || i.id,
        value: i.id,
      }))
      if (
        me.organisation?.role === 'admin' ||
        me.organisation?.role === 'owner'
      ) {
        campusOption = [
          {
            key: '-1',
            label: `${orgInfo?.name} Org`,
            value: '',
          },
        ].concat(campusOption)
      }
      return campusOption
    }
    return []
  }, [me?.campusAccess])

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
        <H5 className="text-center">{t('plans.select-campus-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item name="campus">
            <Select
              options={options}
              placeholder={t('campuses.enter-the-campus')}
              defaultValue={defaultCampus ?? ''}
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => (
              <Button
                disabled={
                  !form.getFieldValue('campus') &&
                  !['owner', 'admin'].includes(me.organisation.role ?? '')
                }
                className="w-1/2"
                type="primary"
                htmlType="submit"
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

export default forwardRef(EnterCampusModal)
