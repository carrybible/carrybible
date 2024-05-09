import _ from 'lodash'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Form, Modal } from 'antd'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import moment, { Moment } from 'moment'

import { H5, Text } from '@components/Typography'
import Button from '@components/Button'
import DatePicker from '@components/Calendar'

import IcXCircle from '@assets/icons/XCircleIcon.svg'

export type CampaignDate = {
  startDate?: moment.Moment | null
  endDate?: moment.Moment | null
}

export type SetDateCampaignModalModalRef = {
  show: (mode: 'publish' | 'edit', endDate?: Date) => Promise<CampaignDate>
}

const SetDateCampaignModalModal: ForwardRefRenderFunction<
  SetDateCampaignModalModalRef,
  {}
> = ({}, ref) => {
  const { t } = useTranslation()

  const [isShowModal, setIsShowModal] = useState<boolean>(false)
  const [mode, setMode] = useState<'publish' | 'edit'>('publish')
  const [startDate, setStartDate] = useState<Moment | null>(null)
  const [endDate, setEndDate] = useState<Moment | null>(null)

  const resolveRef = useRef<((date: CampaignDate) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    show: (mode, endDate) => {
      setIsShowModal(true)
      setMode(mode)

      if (mode === 'edit' && !_.isNil(endDate)) {
        setEndDate(moment(endDate))
      }

      return new Promise((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  const handleFormSubmit = async () => {
    setIsShowModal(false)

    if (mode === 'publish') {
      resolveRef.current!({ startDate, endDate })
    } else {
      resolveRef.current!({ endDate })
    }
  }

  const handleCancel = () => {
    setIsShowModal(false)

    setStartDate(null)
    setEndDate(null)
  }

  return (
    <Modal
      closable
      visible={isShowModal}
      onCancel={handleCancel}
      closeIcon={<Image src={IcXCircle} alt="" width={22} height={22} />}
      footer={null}
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
      destroyOnClose={true}
    >
      <div className="flex flex-col items-center">
        <H5>Campaign Duration</H5>
        <Form
          onFinish={handleFormSubmit}
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
        >
          {mode === 'publish' && (
            <Form.Item label={<Text>Start date</Text>}>
              <DatePicker
                value={startDate}
                placeholder="Select start date"
                onChange={(e) => setStartDate(e)}
                className="ant-picker-left-icon my-0 py-4"
                disabledDate={(c) => c.isBefore(moment().add(-1, 'day'))}
              />
            </Form.Item>
          )}
          <Form.Item label={<Text>End date</Text>}>
            <DatePicker
              value={endDate}
              placeholder="Select end date"
              onChange={(e) => setEndDate(e)}
              className="ant-picker-left-icon my-0 py-4"
              disabledDate={(c) =>
                c.isBefore(startDate) || c.isBefore(moment())
              }
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              span: 24,
              offset: 2,
              sm: { span: 20, offset: 7 },
            }}
            shouldUpdate
          >
            {() => {
              const isValid =
                mode === 'publish'
                  ? startDate != null && endDate != null
                  : endDate != null

              return (
                <Button
                  loading={false}
                  disabled={!isValid}
                  className="w-full sm:w-1/2"
                  type="primary"
                  htmlType="submit"
                >
                  {t('continue')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(SetDateCampaignModalModal)
