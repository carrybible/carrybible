import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import Avatar, { ChooseImageType } from '@components/Avatar'
import Button from '@components/Button'
import Input from '@components/Input'
import CampusInput from '@components/Input/CampusInput'
import GroupLeaderInput, {
  LeaderSelectedValue,
} from '@components/Input/GroupLeaderInput'
import Select from '@components/Select'
import { H5, SmallText, Text } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { Group } from '@redux/slices/group'
import { groupTimeZone } from '@shared/Constants'
import {
  createGroup,
  CreateGroupResp,
  inviteGroup,
  updateGroup,
} from '@shared/Firebase/group'
import { getRandomImage } from '@shared/Unsplash'
import { Form, message, Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useState,
} from 'react'

type Props = {
  onUpdate?: () => void
  onCreate?: () => void
}

export type GroupCreationModalRef = {
  show: (group?: Group) => void
}

const GroupInfoModal: ForwardRefRenderFunction<GroupCreationModalRef, Props> = (
  props,
  ref
) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const organisation = useAppSelector((state) => state.me.organisation)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const [mode, setMode] = useState<'create' | 'update'>('create')
  const [loading, setLoading] = useState(false)
  const [updateGroupInfo, setUpdateGroup] = useState<Group | undefined>()

  const [avatar, setAvatar] = useState<ChooseImageType>({ src: '', type: '' })
  const [loadingAvatar, setLoadingAvatar] = useState(false)

  const show = (group?: Group) => {
    setIsModalVisible(true)
    if (group) {
      setMode('update')
      setUpdateGroup(group)
      setAvatar({ src: group.image })
      form.resetFields()
    } else {
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
    setUpdateGroup(undefined)
  }

  const onFinish = async (values: {
    groupName: string
    affiliatedCampus: { id: string }
    groupLeader: LeaderSelectedValue
    groupTimezone: string
  }) => {
    setLoading(true)
    let resp: CreateGroupResp = { success: false, message: '' }
    if (mode !== 'update' || !updateGroupInfo) {
      if (values.groupLeader.emails?.length) {
        resp = await inviteGroup({
          name: values.groupName,
          timeZone: Number(values.groupTimezone),
          emails: values.groupLeader.emails,
          uids: values.groupLeader.userIds,
          image: avatar,
          campusId: values.affiliatedCampus?.id || '',
        })
      } else {
        resp = await createGroup({
          name: values.groupName,
          timeZone: Number(values.groupTimezone),
          uids: values.groupLeader.userIds,
          orgId: organisation?.id,
          image: avatar,
          campusId: values.affiliatedCampus?.id || '',
          t,
        })
      }
    } else {
      resp = await updateGroup({
        groupId: updateGroupInfo.id,
        image: avatar || { src: updateGroupInfo.image },
        name: values.groupName,
        timeZone: Number(values.groupTimezone),
      })
    }
    setLoading(false)
    if (!resp.success) {
      message.error(t(resp.message ?? 'group.failed-update-group'))
      return
    }
    if (mode === 'create') {
      message.success(t('group.group-created'))
      props.onCreate?.()
    }

    if (mode === 'update') message.success(t('group.group-updated'))
    handleCancel()
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
      <div className={classNames('items-center', 'flex flex-col')}>
        <H5>
          {mode === 'update'
            ? t('group.edit-group-details')
            : t('group.create-group')}
        </H5>

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
          className="mt-6 mr-10 w-full sm:mr-0"
          layout="vertical"
          labelCol={{ span: 14, offset: 2 }}
          wrapperCol={{ span: 20, offset: 2 }}
          disabled={loading}
        >
          <Form.Item
            name="groupName"
            label={<Text strong>{t('group.group-name')}</Text>}
            required
            initialValue={updateGroupInfo?.name}
          >
            <Input placeholder={t('group.enter-group-name')} />
          </Form.Item>

          <Form.Item
            name="affiliatedCampus"
            label={<Text strong>{t('group.affiliated-campus')}</Text>}
            initialValue={updateGroupInfo?.campus}
          >
            <CampusInput
              disabled={mode === 'update'}
              placeholder={
                <SmallText className="ml-2 text-neutral-70">
                  {mode !== 'update' && t('group.search-by-campus')}
                </SmallText>
              }
            />
          </Form.Item>

          <Form.Item
            name="groupLeader"
            label={<Text strong>{t('group.group-leader')}</Text>}
            hidden={mode !== 'create'}
            required={mode === 'create'}
          >
            <GroupLeaderInput
              placeholder={
                <SmallText className="ml-2 text-neutral-70">
                  {t('group.enter-group-leader')}
                </SmallText>
              }
              limit={1}
            />
          </Form.Item>
          <Form.Item
            name="groupTimezone"
            label={<Text strong>{t('group.group-timezone')}</Text>}
            required
            initialValue={updateGroupInfo?.timeZone.toString()}
          >
            <Select
              options={groupTimeZone}
              placeholder={t('group.enter-timezone-name')}
            />
          </Form.Item>
          <Form.Item
            wrapperCol={{ span: 24, offset: 2, sm: { span: 20, offset: 7 } }}
            shouldUpdate
          >
            {() => {
              const groupName = form.getFieldValue('groupName')
              const groupLeader = form.getFieldValue('groupLeader')
              const groupTimezone = form.getFieldValue('groupTimezone')

              const validate =
                mode === 'create'
                  ? groupName &&
                    groupTimezone !== undefined &&
                    avatar.src &&
                    (groupLeader?.emails?.length ||
                      groupLeader?.userIds?.length)
                  : [
                      groupName !== updateGroupInfo?.name,
                      groupTimezone !== updateGroupInfo?.timeZone,
                      avatar.src !== updateGroupInfo?.image,
                    ].some(Boolean)
              return (
                <Button
                  loading={loading}
                  disabled={!validate || loading}
                  className="w-full sm:w-1/2"
                  type="primary"
                  htmlType="submit"
                >
                  {mode === 'update' ? t('update') : t('finish')}
                </Button>
              )
            }}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default forwardRef(GroupInfoModal)
