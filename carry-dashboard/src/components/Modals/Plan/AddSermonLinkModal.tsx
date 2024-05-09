import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { generatePlanFromSermon } from '@shared/Firebase/plan'
import { wait } from '@shared/Utils'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'
import WarningIcon from '@assets/icons/warning.svg'

type Props = {}

export type AddSermonLinkModalRef = {
  show: () => void
}

const AddSermonLinkModal: ForwardRefRenderFunction<
  AddSermonLinkModalRef,
  Props
> = ({}, ref) => {
  // const me = useAppSelector((state) => state.me)
  const { startLoading, stopLoading } = useGlobalLoading()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
    },
  }))

  const handleCancel = () => {
    form.resetFields()

    setIsModalVisible(false)
    setLoading(false)
  }

  const onFinish = async (values: { link: string }) => {
    setLoading(true)

    const loadingAsync = async () => {
      await startLoading({
        message: '⬆️ Uploading your sermon...',
        background: 'primary',
      })
      await wait(1000)
      await startLoading({
        message: '👀 Scanning for key verses...',
        background: 'primary',
      })
      await wait(1000)
      await startLoading({
        message: '✏️ Writing discussion questions...',
        background: 'primary',
      })
      await wait(1000)
      const loadingId = await startLoading({
        message: '🎥 Editing a video highlight...',
        background: 'primary',
      })
      return loadingId
    }

    try {
      await Promise.all([
        generatePlanFromSermon(values.link),
        loadingAsync(),
      ]).then(async (datas) => {
        const { success, message: errorMessage, data } = datas[0]
        stopLoading(datas[1])
        if (success) {
          handleCancel()
          await router.push({
            pathname: `/plans/${data.planId}`,
            query: { mode: 'edit' },
          })
        } else {
          if (!datas[0]) {
            console.error('generate plan error: ', errorMessage)

            Modal.confirm({
              closable: true,
              centered: true,
              icon: null,
              onCancel: () => {},
              okButtonProps: { className: 'hidden' },
              cancelButtonProps: { className: 'hidden' },
              wrapClassName: 'overflow-scroll no-scrollbar py-10 bg-primary',
              closeIcon: (
                <Image
                  src={XCircleIcon}
                  alt="close-icon"
                  width={22}
                  height={22}
                />
              ),
              width: 'auto',
              content: (
                <div
                  className={classNames(
                    'items-center',
                    'flex flex-col',
                    'py-10'
                  )}
                >
                  <H5>
                    {'Uh-oh! There was an error processing your sermon link'}
                  </H5>
                  <div className="pt-10 pb-4">
                    <Image
                      src={WarningIcon}
                      alt="confirm-icon"
                      width={76}
                      height={76}
                    />
                  </div>
                  <div className="mx-10 pb-10 text-center opacity-75">
                    <Text>
                      {
                        'The YouTube link submitted was flagged as non-sermon content. \nClick below to try another link.'
                      }
                    </Text>
                  </div>
                  <Button
                    className="w-1/2"
                    type="primary"
                    onClick={() => {
                      // resolve(true)
                      Modal.destroyAll()
                    }}
                  >
                    {t('Go back')}
                  </Button>
                </div>
              ),
            })
            return
          } else {
            message.error(t('error-server'))
          }
        }
      })
    } finally {
      setLoading(false)
    }
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
        <H5>{t('plans.paste-your-link')}</H5>
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
            name="link"
            label={<Text strong>{t('plans.sermon-link-youtube')}</Text>}
          >
            <Input placeholder={t('plans.enter-sermon-link')} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 20 }} shouldUpdate>
            {() => {
              const link = form.getFieldValue('link')

              const validate = !!link

              return (
                <Button
                  loading={loading}
                  disabled={!validate || loading}
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                >
                  {t('done')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(AddSermonLinkModal)
