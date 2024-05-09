import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import Loading from '@components/Loading'
import AttachmentCard from '@components/StreamIO/AttachmentCard'
import { MessageText } from '@components/StreamIO/MessageText'
import { withMyMessageTheme } from '@components/StreamIO/MyMessageTheme'
import SendButton from '@components/StreamIO/SendButton'
import useTheme from '@hooks/useTheme'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { Channel, ChannelProps, Chat, Thread } from 'stream-chat-react-native'
import { URLReview } from './GroupChatScreen'
import { ScoreDailyActionType } from '@dts/score'

type Params = {
  screen: {
    thread?: any
    threadId: any
    groupId: string
    forceRemote?: boolean
  }
}

interface Props {
  route: RouteProp<Params, 'screen'>
}

const KEYBOARD_OFFSET_HEIGHT = 44 + 0

const ThreadScreen: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const [group, setGroup] = useState<ChannelProps['channel']>()
  const [thread, setThread] = useState<any>(props.route.params.thread)
  const groupId = props.route.params.groupId
  const Analytics = useAnalytic()

  useEffect(() => {
    const threadId = props.route.params.threadId || props.route.params.thread.id
    StreamIO.client.getMessage(threadId).then((t: any) => {
      const channel = StreamIO.client.channel('messaging', t.message.channel.id)
      setGroup(channel)
      setThread(t.message)
    })
  }, [])

  if (!group || !thread)
    return (
      <Container safe>
        <HeaderBar
          title={I18n.t('text.Discussion')}
          iconLeft={'chevron-thin-left'}
          iconLeftFont={'entypo'}
          colorLeft={color.text}
          iconLeftSize={22}
          onPressLeft={() => {
            navigation.pop()
          }}
          borderedBottom={true}
        />
        <Loading centered style={s.flexGrow} />
      </Container>
    )
  return (
    <Container safe forceInset={{ bottom: true, top: true }}>
      <HeaderBar
        title={I18n.t('text.Discussion')}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          dispatch({ type: TYPES.GROUP.RELOAD_GROUP_CHAT })
          navigation.pop()
        }}
        borderedBottom={true}
      />
      <View style={s.flex}>
        <Chat style={color.chat} client={StreamIO.client} i18nInstance={StreamIO.streamI18n}>
          <Channel
            channel={group}
            thread={thread}
            doSendMessageRequest={(channelId, messageObject) => {
              return group.sendMessage({ ...messageObject, silent: true }, { skip_push: true })
            }}
            threadList
            MessageText={props => <MessageText {...props} showText />}
            Card={AttachmentCard}
            UrlPreview={URLReview}
            SendButton={props => (
              <SendButton
                {...props}
                onSendMessage={t => {
                  Analytics.event(Constants.EVENTS.MESSAGE_REPLIED)
                  Firestore.Group.updateScore(ScoreDailyActionType.SEND_THREAD_MESSAGE, groupId)
                }}
              />
            )}
            myMessageTheme={withMyMessageTheme(color)}
            /*@ts-ignore*/
            // Message={Message}
            // Attachment={props => <Attachment {...props} channel={group} />}
            keyboardBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_HEIGHT + insets.top : undefined}
            allowThreadMessagesInChannel={false}>
            <Thread autoFocus={true} />
          </Channel>
        </Chat>
      </View>
    </Container>
  )
}

ThreadScreen.defaultProps = {}

const s = StyleSheet.create({
  flex: { flex: 1, marginBottom: 10 },
  flexGrow: { flexGrow: 1 },
})

export default ThreadScreen
