import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import SearchCampuses from '@components/SearchCampuses'
import { H5, SmallText, Text } from '@components/Typography'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {}

export type AddCampusToUserModalRef = {
  show: () => Promise<{ campusId: string; campusName: string } | undefined>
}

const AddCampusToUserModal: ForwardRefRenderFunction<
  AddCampusToUserModalRef,
  Props
> = ({}, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { t } = useTranslation()
  const [form] = Form.useForm()

  const resolveRef = useRef<
    | ((
        campus:
          | {
              campusId: string
              campusName: string
            }
          | undefined
      ) => void)
    | null
  >(null)

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<
        | {
            campusId: string
            campusName: string
          }
        | undefined
      >((resolve) => {
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
    resolveRef.current?.({
      campusId: values?.campus,
      campusName: values?.campus,
    })
    handleCancel()
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
        >
          <Form.Item
            name="campus"
            label={<Text strong>{t('campuses.campus')}</Text>}
          >
            <SearchCampuses
              placeholder={
                <SmallText className="ml-3 text-neutral-70">
                  {t('campuses.enter-campus-name')}
                </SmallText>
              }
            />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 7, span: 20 }}>
            <Button className="w-1/2" type="primary" htmlType="submit">
              {t('done')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddCampusToUserModal)
