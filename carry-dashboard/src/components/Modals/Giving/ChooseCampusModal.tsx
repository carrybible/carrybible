/* eslint-disable no-console */
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Button from '@components/Button'
import Checkbox from '@components/Checkbox'
import { H5, Text } from '@components/Typography'
import { TithingFundDetail } from '@dts/Giving'
import { useAppSelector } from '@redux/hooks'
import { getCampuses } from '@shared/Firebase/campus'
import { getCampusAssigned, updateTithingFun } from '@shared/Firebase/giving'
import { Form, message, Modal, Spin } from 'antd'
import classNames from 'classnames'
import { uniq } from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import ReplaceFundModal, { ReplaceFundModalRef } from './ReplaceFundModal'

type Props = {
  callbackUpdated?: (success: boolean) => void
  mode?: 'edit' | 'create'
  skipCheckExistCampus?: boolean
}

export type ChooseCampusModalRef = {
  show: (fund?: TithingFundDetail) => Promise<string[] | undefined>
}

const ChooseCampusModal: ForwardRefRenderFunction<
  ChooseCampusModalRef,
  Props
> = ({ mode = 'create', callbackUpdated, skipCheckExistCampus }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isForceFetch, setIsForceFetch] = useState(true)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const resolveRef = useRef<((v: string[] | undefined) => void) | null>(null)
  const me = useAppSelector((state) => state.me)
  const [options, setOptions] = useState<any[]>([])
  const [fund, setFund] = useState<TithingFundDetail | undefined>(undefined)
  const [defaultCampus, setDefaultCampus] = useState<string[]>()
  const [values, setValues] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingButton, setLoadingButton] = useState(false)
  const [campusAssigned, setCampusAssigned] = useState<string[]>([])
  const replaceFundModalRef = useRef<ReplaceFundModalRef>(null)

  useImperativeHandle(
    ref,
    () => ({
      show: (fund?: TithingFundDetail) => {
        setFund(fund)
        setIsModalVisible(true)
        const list = fund?.campuses.map((item) => item.id)
        setDefaultCampus(list)
        return new Promise<string[] | undefined>((resolve) => {
          resolveRef.current = resolve
        })
      },
    }),
    []
  )

  const handleCancel = () => {
    form.resetFields()
    resolveRef.current = null
    setIsModalVisible(false)
    setLoadingButton(false)
    setLoading(false)
    setValues([])
    setDefaultCampus([])
  }

  const onFinish = async () => {
    if (mode === 'create') {
      resolveRef.current?.(values)
      handleCancel()
    } else if (mode === 'edit' && fund?.id) {
      setLoadingButton(true)
      const {
        success,
        message: errorMessage,
        isAuth,
      } = await updateTithingFun({
        fund: {
          id: fund.id,
          campusIds: values,
        },
      })
      if (!success && !isAuth) {
        console.error('update fund Error: ', errorMessage)
        message.error(t('error-server'))
        return
      }
      callbackUpdated?.(true)
      message.success(t('giving.fund-updated'))
      handleCancel()
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const searchData = await getCampuses({
        search: '',
        organisationId: me.organisation.id,
        limit: 999999999,
        page: 1,
      })
      const list: any = searchData.data.map((item) => ({
        key: item.id || '',
        label: item.name || item.id,
        value: item.id,
        image: item.image || '',
      }))
      if (!skipCheckExistCampus) {
        const campus = await getCampusAssigned()
        let campusAssignedIds: string[] = []
        if (campus) {
          campusAssignedIds = campus.map((item) => item.id)
        }
        setCampusAssigned(uniq(campusAssignedIds))
      }
      setOptions(list)
      setLoading(false)
    }
    if (isModalVisible && isForceFetch) {
      fetchData()
    }
  }, [me.organisation.id, isModalVisible, isForceFetch])

  const handleConfirmReplaceCampus = (option: any) => {
    setIsModalVisible(false)
    return replaceFundModalRef.current?.show(option?.label).then((value) => {
      setIsModalVisible(true)
      setIsForceFetch(false)
      return value
    })
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
      <Spin spinning={loading}>
        <div className={classNames('items-center', 'flex flex-col', 'py-10')}>
          <div className="mt-4 w-7/12">
            <H5 className="mb-10 text-center ">
              {t('giving.select-campuses-title')}
            </H5>
            <div className="text-center">
              <Text className="text-neutral-80">
                {t('giving.choose-campuses-description')}
              </Text>
            </div>
          </div>
          <Form
            form={form}
            onFinish={onFinish}
            className="mt-6 mr-10 flex w-full flex-col items-center justify-center sm:mr-0"
            layout="vertical"
            labelCol={{ span: 14, offset: 2 }}
            wrapperCol={{ span: 20, offset: 2 }}
          >
            <Form.Item name="campuses" className="w-full sm:w-8/12">
              <Checkbox
                confirmCheckedList={campusAssigned}
                defaultCheckedList={defaultCampus}
                options={options}
                onChange={(list) => {
                  setValues(list)
                }}
                onConfirmValidateValue={handleConfirmReplaceCampus}
                selectAllTitle={t('giving.select-all-campuses')}
              />
            </Form.Item>

            <Form.Item
              wrapperCol={{ offset: 7, span: 20 }}
              className="w-full pt-5"
              shouldUpdate
            >
              {() => (
                <Button
                  loading={loadingButton}
                  disabled={
                    values.length === 0 ||
                    values?.join() === defaultCampus?.sort().join() ||
                    loading ||
                    loadingButton
                  }
                  className="w-1/2"
                  type="primary"
                  htmlType="submit"
                >
                  {mode === 'create' ? t('continue') : t('done')}
                </Button>
              )}
            </Form.Item>
          </Form>
        </div>
      </Spin>
      <ReplaceFundModal ref={replaceFundModalRef} />
    </Modal>
  )
}

export default forwardRef(ChooseCampusModal)
