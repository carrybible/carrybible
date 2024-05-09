import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Input from '@components/Input'
import { H5, Text } from '@components/Typography'
import { PassageAct } from '@dts/Plans'
import validatePassage from '@shared/BiblePassageValidator'
import { toPassageString } from '@shared/Utils'
import { Form, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {}

export type AddPassageModalRef = {
  show: (initAct?: PassageAct) => Promise<PassageAct | undefined>
}

const AddPassageModal: ForwardRefRenderFunction<AddPassageModalRef, Props> = (
  {},
  ref
) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((passage?: PassageAct) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (initAct) => {
      setIsModalVisible(true)
      if (initAct) {
        form.setFieldValue('passage', toPassageString(initAct))
      }
      return new Promise<PassageAct | undefined>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleCancel = () => {
    form.resetFields()
    setIsModalVisible(false)
    resolveRef.current?.()
  }

  const onFinish = async ({ passage }: { passage: string }) => {
    const { bookName, bookAbbr, bookId, verseFrom, verseTo, chapterNumber } =
      validatePassage(passage)

    resolveRef.current?.({
      type: 'passage',
      verses: [
        {
          from: verseFrom,
          to: verseTo,
        },
      ],
      verseRange: `${verseFrom}-${verseTo}`,
      chapter: {
        chapterNumber,
        bookName,
        bookId,
        bookAbbr,
      },
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
    >
      <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
        <H5>{t('plans.add-passage-title')}</H5>
        <Form
          form={form}
          onFinish={onFinish}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          <Form.Item
            name="passage"
            label={<Text strong>{t('plans.bible-passage')}</Text>}
            rules={[
              {
                validator: async (rule, value: string) => {
                  validatePassage(value)
                },
              },
            ]}
          >
            <Input placeholder={t('plans.enter-bible-passage')} />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 7, span: 20 }}
            className="pt-5"
            shouldUpdate
          >
            {() => {
              return (
                <Button
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !form.getFieldValue('passage') ||
                    form.getFieldsError().filter(({ errors }) => errors.length)
                      .length > 0
                  }
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

export default forwardRef(AddPassageModal)
