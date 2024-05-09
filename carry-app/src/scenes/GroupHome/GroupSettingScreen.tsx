import ConfirmDialog, { ConfirmDialogRef } from '@components/ConfirmDialog'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import InputDialog, { InputModalRef } from '@components/InputDialog'
import SettingItem from '@components/SettingItem'
import Toast from '@components/Toast'
import { RootState } from '@dts/state'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore } from '@shared/index'
import StreamIO from '@shared/StreamIO'
import { UnsplashImage } from '@shared/Unsplash'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ AccountSetting: ParamProps }, 'AccountSetting'>

const GroupSettingScreen: React.FC<Props> = () => {
  const dispatch = useDispatch()
  const { color } = useTheme()
  const { showLoading, hideLoading } = useLoading()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { channel, isOwner } = group
  const isMuted = channel?.muteStatus().muted
  const Analytics = useAnalytic()

  const inputDialogRef = React.useRef<InputModalRef | null>(null)
  const confirmDeleteDialogRef = React.useRef<ConfirmDialogRef | null>(null)
  const confirmLeaveDialogRef = React.useRef<ConfirmDialogRef | null>(null)

  const handleChangeGroupName = async (newName: string) => {
    inputDialogRef.current?.close()
    showLoading()
    if (newName) {
      await Firestore.Group.updateGroup({ name: newName }, group.id || '')
      toast.success(I18n.t('text.Update group name success'))
    }
    hideLoading()
  }

  const openImagePicker = () => {
    NavigationRoot.push(Constants.SCENES.MODAL.PICKER_IMAGE, {
      onSelect: async (i: UnsplashImage) => {
        if (i) {
          if (i.source === 'gallery') {
            await Firestore.Storage.upload(i.urls.regular, 'images', `group_avatar_${group.id}`).then(async url => {
              await Firestore.Group.updateGroup({ image: url }, group.id || '')
              Toast.success(I18n.t('text.change success'))
            })
          } else {
            await Firestore.Group.updateGroup({ image: i.urls.regular }, group.id || '')
            Toast.success(I18n.t('text.change success'))
          }
        }
      },
    })
  }

  const toggleMute = () => {
    const currentChannel = StreamIO.client.channel('messaging', group.id)
    if (!isMuted) {
      currentChannel?.mute().then(() => {
        toast.success(I18n.t('text.Notifications muted'))
        Analytics.event(Constants.EVENTS.NOTIFICATION.MUTE_GROUP)
        Firestore.Group.muteMember({ groupId: group.id, mute: true })
      })
      dispatch({ type: TYPES.GROUP.UPDATE, params: { channel: currentChannel } })
    } else {
      currentChannel?.unmute().then(() => {
        toast.success(I18n.t('text.Notifications unmuted'))
        Analytics.event(Constants.EVENTS.NOTIFICATION.UNMUTE_GROUP)
        Firestore.Group.muteMember({ groupId: group.id, mute: false })
      })
      dispatch({ type: TYPES.GROUP.UPDATE, params: { channel: currentChannel } })
    }
  }

  const deleteMember = async () => {
    try {
      global.FLAG_LOGOUT = true
      const success = await Firestore.Group.deleteMember({ groupId: group.id, memberId: me.uid, type: 'leave' })
      if (success) {
        toast.success(I18n.t('text.Left group'))
        NavigationRoot.reset({ index: 0, routes: [{ name: Constants.SCENES.LAUNCH.BIBLE_GROUPS }] })
      }
    } catch (e) {
      toast.error(I18n.t('error.Unable to leave group'))
    }
  }

  const deleteGroup = async () => {
    try {
      await Promise.all([Firestore.Auth.updateUser({ latestJoinedGroup: '' }), Firestore.Group.deleteGroup({ groupId: group.id })])
      toast.success(I18n.t('text.Group is deleted'))
    } catch (e) {
      devWarn('GroupHeaderActions', e)
      toast.error(I18n.t('error.Unable to delete group'))
    }
  }

  const onPressAutoAction = async () => {
    showLoading()
    const result = await Firestore.Group.updateGroup(
      {
        disabledAutoAction: group?.disabledAutoAction ? false : true,
      },
      group.id,
    )
    if (!result) {
      toast.error(I18n.t('error.Can not update group'))
    }
    hideLoading()
  }

  return (
    <Container safe>
      <HeaderBar
        title={I18n.t('text.Group settings')}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <View style={styles.wrapper}>
        {isOwner && (
          <>
            <SettingItem
              icon="type"
              text={I18n.t('text.Change group name')}
              onPress={() => {
                inputDialogRef.current?.open()
              }}
            />
            <SettingItem
              icon="image"
              text={I18n.t('text.Change group picture')}
              onPress={() => {
                openImagePicker()
              }}
            />
          </>
        )}
        <SettingItem
          icon="bell"
          text={isMuted ? I18n.t('text.Unmute notifications') : I18n.t('text.Mute notifications')}
          onPress={() => {
            toggleMute()
          }}
        />
        {isOwner ? (
          <SettingItem
            icon={group?.disabledAutoAction ? 'eye' : 'eye-off'}
            text={`${group?.disabledAutoAction ? I18n.t('text.Enable') : I18n.t('text.Disable')} ${I18n.t(
              'text.Automatic Prayer and Gratitude',
            )}`}
            onPress={onPressAutoAction}
          />
        ) : null}
        {isOwner ? (
          <SettingItem
            icon="x"
            text={I18n.t('text.Delete group')}
            tintColor={color.red}
            textColor={color.red}
            onPress={() => {
              confirmDeleteDialogRef.current?.open()
            }}
          />
        ) : (
          <SettingItem
            icon="log-out"
            text={I18n.t('text.Leave group')}
            tintColor={color.red}
            textColor={color.red}
            onPress={() => {
              confirmLeaveDialogRef.current?.open()
            }}
          />
        )}
      </View>

      <InputDialog
        ref={inputDialogRef}
        title={I18n.t('text.Change name')}
        placeholder={I18n.t(`text.Enter group name (${group?.name})`)}
        onOkPress={handleChangeGroupName}
      />
      <ConfirmDialog
        ref={confirmLeaveDialogRef}
        title={I18n.t('text.Confirm')}
        message={I18n.t('text.Are you sure you want to leave this group')}
        onOkPress={() => {
          confirmLeaveDialogRef.current?.close()
          deleteMember()
        }}
      />
      <ConfirmDialog
        ref={confirmDeleteDialogRef}
        title={I18n.t('text.Confirm')}
        message={I18n.t('text.Are you sure you want to delete this group')}
        onOkPress={() => {
          confirmDeleteDialogRef.current?.close()
          deleteGroup()
        }}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 32, marginTop: 32 },
})

export default GroupSettingScreen
