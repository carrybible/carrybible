import AttachmentPickerSelectButton from '@components/AttachmentPickerSelectButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { InlineDateSeparator } from '@components/InlineDateSeparator'
import Loading from '@components/Loading'
import AttachmentCard from '@components/StreamIO/AttachmentCard'
import { MessageText } from '@components/StreamIO/MessageText'
import MyMessageTheme from '@components/StreamIO/MyMessageTheme'
import SendButton from '@components/StreamIO/SendButton'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { useIsFocused, useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { KEYBOARD_OFFSET_HEIGHT } from '@scenes/Common/PrivateChatScreen'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React from 'react'
import { Linking, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { Card, Channel, Chat, Message, MessageInput, MessageList, OverlayProvider } from 'stream-chat-react-native'

const GroupChatScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { color } = useTheme()
  const myMessageTheme = MyMessageTheme()
  const isFocus = useIsFocused()
  const Analytics = useAnalytic()
  const insets = useSafeAreaInsets()
  let content = <Loading />

  // Add isFocus here to fix #550: Group chat icon bubble count is not displaying
  // Because mark as read will be called automatically if channel is visible, this prevent the unreadCount displayed if user have navigated this screen before
  if (group.channel && isFocus) {
    content = (
      <View style={styles.container}>
        <OverlayProvider
          messageTextNumberOfLines={2}
          // @ts-ignore
          AttachmentPickerSelectButton={AttachmentPickerSelectButton}>
          <Chat
            key={`GroupChat${group.reloadGroupChatCount}`}
            style={color.chat}
            // @ts-ignore
            client={StreamIO.client}
            i18nInstance={StreamIO.streamI18n}>
            <Channel
              key={`GroupChat${group.reloadGroupChatCount}`}
              // @ts-ignore
              channel={group.channel}
              thread={undefined}
              // @ts-ignore
              Card={AttachmentCard}
              Message={msgData => {
                if (msgData.message.hide_message === true) return null
                return <Message {...msgData} />
              }}
              // @ts-ignore
              MessageText={MessageText}
              UrlPreview={URLReview}
              InlineDateSeparator={InlineDateSeparator}
              // DateHeader={() => null}
              SendButton={props => (
                <SendButton
                  {...props}
                  onSendMessage={t => {
                    Firestore.Group.updateScore(ScoreDailyActionType.SEND_GROUP_MESSAGE, group.id)
                    Analytics.event(Constants.EVENTS.CHAT_REPLIED)
                  }}
                />
              )}
              myMessageTheme={myMessageTheme}
              keyboardBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_HEIGHT + insets.top : undefined}>
              <MessageList
                onThreadSelect={(thread: any) => {
                  navigation.navigate(Constants.SCENES.GROUP.THREAD, {
                    thread,
                    groupId: group.id,
                  })
                }}
                additionalFlatListProps={{
                  keyboardShouldPersistTaps: 'never',
                }}
                EmptyStateIndicator={() => <View style={[styles.emptyStateIndicator, { backgroundColor: color.background }]} />}
              />
              <MessageInput />
            </Channel>
          </Chat>
        </OverlayProvider>
      </View>
    )
  }

  return (
    <Container safe={true} forceInset={{ bottom: false, top: true }}>
      <HeaderBar title={I18n.t('text.Group chat')} borderedBottom borderedBottomGradient />
      {content}
    </Container>
  )
}

export const URLReview = props => {
  return (
    <Card
      {...props}
      onPress={() => {
        Linking.openURL(props.title_link)
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 5 },
  emptyStateIndicator: {
    flex: 1,
    flexGrow: 1,
  },
})

export default GroupChatScreen
