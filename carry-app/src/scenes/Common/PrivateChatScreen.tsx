/**
 * Chat Page
 *
 * @format
 *
 */

import Button from '@components/Button'
import ConfirmDialog, { ConfirmDialogRef } from '@components/ConfirmDialog'
import Container from '@components/Container'
import GroupAvatar from '@components/GroupAvatar'
import InAppNotification from '@components/InAppNotification'
import InputDialog, { InputModalRef } from '@components/InputDialog'
import AttachmentCard from '@components/StreamIO/AttachmentCard'
import CustomMessage from '@components/StreamIO/CustomMessage'
import { MessageText } from '@components/StreamIO/MessageText'
import MyMessageTheme from '@components/StreamIO/MyMessageTheme'
import SendButton from '@components/StreamIO/SendButton'
import { Subheading, Text } from '@components/Typography'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import useBack from '@hooks/useBack'
import useDirectMessageChannelId from '@hooks/useDirectMessageChannelId'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { URLReview } from '@scenes/GroupHome/GroupChatScreen'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { Channel, Chat, MessageInput, MessageList } from 'stream-chat-react-native'
import PrivateChatContext from './PrivateChatContext'

interface Props {
  navigation: any
  route: any
}
export const KEYBOARD_OFFSET_HEIGHT = 68

const PrivateChatScreen: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const insets = useSafeAreaInsets()
  const [friend, setFriend] = useState<any>(props.route.params.user)
  const inputDialogRef = useRef<InputModalRef | null>(null)
  const confirmDeleteDialogRef = useRef<ConfirmDialogRef | null>(null)
  const { color } = useTheme()
  const [channel, setChannel] = useState<any>()
  const myMessageTheme = MyMessageTheme()
  const isCreteNew = useRef(false)
  const Analytics = useAnalytic()

  const onPressBack = () => {
    global.CURRENT_PRIVATE_CHAT = undefined
    if (isCreteNew.current) {
      dispatch({ type: TYPES.GROUP.RELOAD_DIRECT_MESSAGES })
      props.navigation.pop(2)
    } else {
      props.navigation.goBack()
    }
  }

  useBack(onPressBack)

  const channelId = useDirectMessageChannelId(friend?.id) ?? props.route.params.id

  useEffect(() => {
    InAppNotification.closeWithCondition(channelId)
  }, [channelId])

  useEffect(() => {
    global.CURRENT_PRIVATE_CHAT = channelId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function start() {
      const channels = await StreamIO.client.queryChannels({ type: 'messaging', id: { $eq: channelId } })
      let c
      if (channels.length > 0) {
        c = channels[0]
      } else {
        isCreteNew.current = true
        c = StreamIO.client.channel('messaging', channelId, {
          name: 'Direct message',
          members: [me.uid, friend.id],
          groupId: group.id,
        })
      }
      await c.watch()
      setChannel(c)
      c.queryMembers({}).then(({ members }) => {
        const member: any = members.find((value: any) => value.user.id !== me.uid)
        if (member) {
          setFriend(member.user)
        }
      })
    }

    start()
  }, [channelId, friend?.id, group.id, me.uid])

  const handleActions = (action: string) => {
    switch (action) {
      case 'change_name':
        inputDialogRef.current?.open()
        break
      case 'mute':
        channel?.mute().then(() => {
          toast.success(I18n.t('text.Notifications muted'))
          Analytics.event(Constants.EVENTS.NOTIFICATION.MUTE_DM)
        })
        break
      case 'unmute':
        channel?.unmute().then(() => {
          toast.success(I18n.t('text.Notifications unmuted'))
          Analytics.event(Constants.EVENTS.NOTIFICATION.UNMUTE_DM)
        })
        break
      case 'delete':
        confirmDeleteDialogRef.current?.open()
        break
    }
  }

  const openActions = () => {
    const muted = channel?.muteStatus()
    const isMuted = muted?.muted
    props.navigation.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
      item: null,
      handleActions: handleActions,
      headerStyle: { height: 75 },
      headerComponent: () => <Text style={styles.headerComponent}>{I18n.t('text.Conversation')}</Text>,
      actions: [
        // { title: 'Change conversation name', icon: 'type', action: 'change_name' },
        {
          title: isMuted ? I18n.t('text.Unmute notifications') : I18n.t('text.Mute notifications'),
          icon: 'bell',
          action: isMuted ? 'unmute' : 'mute',
        },
        { title: I18n.t('text.Delete conversation'), color: 'red', icon: 'log-out', action: 'delete' },
      ],
    })
  }

  const handleInputDialog = async (t: string) => {
    if (t) await channel.update({ name: t })
    inputDialogRef.current?.close()
  }

  const handleConfirmDelete = async () => {
    confirmDeleteDialogRef.current?.close()

    try {
      const c = channel
      await c.delete()
    } finally {
      setChannel(undefined)
      dispatch({ type: TYPES.GROUP.RELOAD_DIRECT_MESSAGES })
      props.navigation.pop()
    }
  }

  const messageActions = ({
    blockUser,
    canModifyMessage,
    copyMessage,
    deleteMessage,
    editMessage,
    error,
    flagMessage,
    isMyMessage,
    isThreadMessage,
    message,
    messageReactions,
    muteUser,
    repliesEnabled,
    reply,
    retry,
  }) => {
    return error && isMyMessage
      ? [retry, editMessage, deleteMessage]
      : messageReactions
      ? undefined
      : canModifyMessage
      ? isThreadMessage
        ? message.text
          ? isMyMessage
            ? [editMessage, copyMessage, deleteMessage]
            : [copyMessage, flagMessage]
          : isMyMessage
          ? [editMessage, deleteMessage]
          : [flagMessage]
        : message.text
        ? repliesEnabled
          ? isMyMessage
            ? [reply, editMessage, copyMessage, deleteMessage]
            : [reply, copyMessage, flagMessage]
          : isMyMessage
          ? [editMessage, copyMessage, deleteMessage]
          : [copyMessage]
        : repliesEnabled
        ? isMyMessage
          ? [reply, editMessage, deleteMessage]
          : [reply, flagMessage]
        : isMyMessage
        ? [editMessage, deleteMessage]
        : [flagMessage]
      : isThreadMessage
      ? message.text
        ? isMyMessage
          ? [copyMessage, deleteMessage]
          : [copyMessage, muteUser, flagMessage, blockUser]
        : isMyMessage
        ? [deleteMessage]
        : [muteUser, blockUser, flagMessage]
      : message.text
      ? repliesEnabled
        ? isMyMessage
          ? [reply, copyMessage, deleteMessage]
          : [reply, copyMessage, muteUser, flagMessage, blockUser]
        : isMyMessage
        ? [copyMessage, deleteMessage]
        : [copyMessage, muteUser, flagMessage, blockUser]
      : repliesEnabled
      ? isMyMessage
        ? [reply, deleteMessage]
        : [reply, muteUser, blockUser]
      : isMyMessage
      ? [deleteMessage]
      : [muteUser, blockUser]
  }

  if (!channel) return <Container safe={true} />
  return (
    <Container safe={true}>
      <View
        style={[
          styles.headerWrapper,
          {
            borderBottomColor: color.gray5,
          },
        ]}>
        <View style={styles.backBtnWrapper}>
          <Button.Icon icon="chevron-left" size={28} color={color.text} onPress={onPressBack} width={44} />
        </View>
        <View style={styles.avatars}>
          <GroupAvatar type={'direct'} members={Object.values(channel.state.members).map((i: any) => i.user)} size={40} />
          <Subheading bold>{friend?.name}</Subheading>
        </View>
        <View style={styles.moreOptions}>
          <Button.Icon icon="more-vertical" size={24} color={color.text} onPress={openActions} width={44} />
        </View>
      </View>

      <View style={styles.listWrapper}>
        <PrivateChatContext.Provider value={friend}>
          <Chat key="PrivateChat" client={StreamIO.client} style={color.chat} i18nInstance={StreamIO.streamI18n}>
            <Channel
              key="PrivateChat"
              messageActions={messageActions}
              channel={channel}
              initialScrollToFirstUnreadMessage
              enforceUniqueReaction
              myMessageTheme={myMessageTheme}
              SendButton={props => (
                <SendButton
                  {...props}
                  onSendMessage={t => {
                    Analytics.event(Constants.EVENTS.DM_REPLIED)
                    Firestore.Group.updateScore(ScoreDailyActionType.SEND_DIRECT_MESSAGE, group.id)
                  }}
                />
              )}
              Message={CustomMessage}
              MessageText={MessageText}
              Card={AttachmentCard}
              UrlPreview={URLReview}
              keyboardBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_HEIGHT + insets.top : undefined}>
              <MessageList
                onThreadSelect={thread => {
                  // setThread(thread)
                  // navigation.navigate('Thread')
                }}
                additionalFlatListProps={{
                  // style: { backgroundColor: color.background },
                  // contentContainerStyle: { backgroundColor: color.background },
                  keyboardShouldPersistTaps: 'never',
                }}
              />
              <MessageInput />
            </Channel>
          </Chat>
        </PrivateChatContext.Provider>
      </View>
      <InputDialog
        ref={inputDialogRef}
        title={I18n.t('text.Change conversation name')}
        placeholder={I18n.t('text.Input name')}
        onOkPress={handleInputDialog}
      />
      <ConfirmDialog
        ref={confirmDeleteDialogRef}
        title={I18n.t('text.Confirm')}
        message={I18n.t('text.Are you sure you want to delete this conversation')}
        onOkPress={handleConfirmDelete}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  headerComponent: { fontWeight: '700', maxHeight: 50 },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
  },
  avatars: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  listWrapper: {
    flex: 1,
    paddingBottom: 5,
  },
})

export default PrivateChatScreen
