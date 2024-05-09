import Button from '@components/Button'
import Container from '@components/Container'
import Loading from '@components/Loading'
import AttachmentCard from '@components/StreamIO/AttachmentCard'
import { MessageText } from '@components/StreamIO/MessageText'
import { withMyMessageTheme } from '@components/StreamIO/MyMessageTheme'
import SendButton from '@components/StreamIO/SendButton'
import { Text } from '@components/Typography'
import { ScoreDailyActionType } from '@dts/score'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import VersesPickerModal from '@scenes/Study/Main/components/Activities/VersesPickerModal'
import { useAnalytic } from '@shared/Analytics'
import { BibleFormatter, Constants, Firestore, Metrics, StreamIO } from '@shared/index'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Keyboard, Platform, StyleSheet, View } from 'react-native'
import { Portal } from 'react-native-portalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Message } from 'stream-chat'
import { Channel, ChannelProps, Chat, Thread } from 'stream-chat-react-native'
import { URLReview } from './GroupChatScreen'

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
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const [group, setGroup] = useState<ChannelProps['channel']>()
  const [thread, setThread] = useState<any>(props.route.params.thread)
  const [titleHeight, setTitleHeight] = useState(0)
  const replyCount = useRef(0)
  const [isShowPassage, setShowPassage] = useState(false)
  const [chapters, setChapters] = useState(null)
  const [titleFontSize, setTitleFontSize] = useState(0)
  const groupId = props.route.params.groupId
  const threadId = props.route.params.threadId || props.route.params.thread.id
  const keyboardPadding = useKeyboardPadding()
  const Analytics = useAnalytic()
  const { landscape } = useScreenMode()

  useEffect(() => {
    let channelEvent = null
    const getPassage = async () => {
      const c = await Firestore.Group.getChaptersByThreadId(groupId, threadId)
      setChapters(c)
    }
    StreamIO.client.getMessage(threadId).then(async (t: any) => {
      await getPassage()
      const channel = StreamIO.client.channel('messaging', t.message.channel.id)
      setGroup(channel)
      setThread(t.message)
      replyCount.current = t.message.reply_count
      channelEvent = channel.on(e => {
        if (e.message?.reply_count) replyCount.current = e.message?.reply_count
      })
    })
    return () => channelEvent?.unsubscribe?.()
  }, [])

  const onOverlayPress = useCallback(() => setShowPassage(true), [])

  const addVerseIcon = memo(() => {
    return (
      <Button.Icon
        icon={require('@assets/icons/ic-add-verse.png')}
        color={color.accent2}
        size={24}
        onPress={onOverlayPress}
        style={s.addIcon}
      />
    )
  })

  const onTitleLayout = e => {
    replyCount.current && setTitleHeight(e.nativeEvent.layout.height)
  }
  const onPressSendVerses = async (choosenVerse, bibleType) => {
    if (bibleType === 'new') {
      const message: Message = {
        text: choosenVerse.verses || '',
        parent_id: threadId,
        attachments: [
          {
            osis: choosenVerse.verses,
            rootIdStr: choosenVerse.rawVerse.join(','),
            rootId: choosenVerse.rawVerse[0],
            type: 'new-bible',
            texts: choosenVerse?.texts || [],
          },
        ],
      }

      await group?.sendMessage(message, { skip_push: true })
      await Firestore.Group.updateThreadViewer(groupId, threadId, replyCount.current + 1)
      return
    } else {
      const rootIdArray: number[] = Array.from(choosenVerse.selected)
      const osisStr = BibleFormatter.toOsis(rootIdArray)
      const message: Message = {
        text: choosenVerse.verses || '',
        parent_id: threadId,
        attachments: [{ osis: osisStr, rootIdStr: rootIdArray.join(','), rootId: rootIdArray[0], type: 'bible' }],
      }

      await group?.sendMessage(message, { skip_push: true })
      await Firestore.Group.updateThreadViewer(groupId, threadId, replyCount.current + 1)
    }
  }

  const onTextLayout = e => {
    const { lines } = e.nativeEvent
    if (titleFontSize === 0) {
      let fontSize = 22 - lines.length * 2
      if (lines.length > 5) fontSize = 10
      setTitleFontSize(fontSize)
    }
  }

  const Title = () => (
    <View
      style={[
        s.titleContainer,
        { backgroundColor: color.id === 'light' ? color.white : color.black, borderColor: color.whiteSmoke },
        landscape ? { width: Metrics.screen.height - 32 } : {},
      ]}
      onLayout={onTitleLayout}>
      <Text
        bold
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          fontSize: titleFontSize,
          color: titleFontSize === 0 ? 'transparent' : color.text,
        }}
        numberOfLines={5}
        onTextLayout={onTextLayout}>
        {thread?.text}
      </Text>
    </View>
  )

  if (!group || !thread)
    return (
      <Container safe>
        <View style={s.header}>
          <Button.Icon icon="x" size={35} color={color.text} onPress={() => navigation.pop()} />
        </View>
        <Loading centered style={s.flexGrow} />
      </Container>
    )
  return (
    <>
      <Container
        // eslint-disable-next-line react-native/no-inline-styles
        style={{ backgroundColor: color.id === 'light' ? '#FAFAFA' : color.background }}
        safe
        forceInset={{ bottom: true, top: true }}>
        <View style={s.header}>
          <Button.Icon icon="x" size={35} color={color.text} onPress={() => navigation.pop()} />
        </View>
        {!replyCount.current ? <Title /> : null}
        <Animated.View
          style={[
            s.flex,
            {
              transform: [
                {
                  translateY: keyboardPadding,
                },
              ],
            },
          ]}>
          <Chat
            style={{
              typingIndicator: {
                container: {
                  backgroundColor: color.middle,
                },
              },
              messageList: {
                container: {
                  flex: 1,
                  paddingTop: (replyCount.current && titleHeight) || 0,
                  backgroundColor: color.id === 'light' ? '#FAFAFA' : color.black,
                  paddingHorizontal: 0,
                  paddingBottom: 0,
                  borderBottomEndRadius: 20,
                  borderBottomStartRadius: 20,
                  borderTopEndRadius: replyCount.current ? 20 : 0,
                  borderTopStartRadius: replyCount.current ? 20 : 0,
                },
              },
              messageSimple: {
                content: {
                  containerInner: {
                    backgroundColor: color.id === 'light' ? '#EDEEF3' : '#545a79',
                    borderColor: 'transparent',
                  },
                },
              },
              messageInput: {
                container: {
                  backgroundColor: 'transparent',
                  borderTopWidth: 0,
                  marginTop: 12,
                  alignItems: 'center',
                  paddingHorizontal: 0,
                },
                inputBoxContainer: {
                  backgroundColor: color.id === 'light' ? color.white : color.black,
                  borderRadius: 0,
                  borderWidth: 0,
                  height: '100%',
                  maxHeight: 50,
                  borderTopLeftRadius: 20,
                  borderBottomLeftRadius: 20,
                  marginLeft: 0,
                },
                inputBox: {
                  color: color.text,
                  fontFamily: undefined,
                },
                sendButtonContainer: {
                  paddingTop: Platform.select({ android: 7, ios: 6 }),
                  height: '100%',
                  maxHeight: 50,
                  padding: 0,
                  marginTop: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: color.id === 'light' ? color.white : color.black,
                  borderTopRightRadius: 20,
                  borderBottomEndRadius: 20,
                  paddingHorizontal: Metrics.insets.horizontal,
                },
                attachButtonContainer: {
                  backgroundColor: color.id === 'light' ? '#FAFAFA' : color.background,
                },
              },
            }}
            client={StreamIO.client}
            i18nInstance={StreamIO.streamI18n}>
            <Channel
              disableKeyboardCompatibleView
              threadList={true}
              channel={group}
              thread={thread}
              doSendMessageRequest={(channelId, messageObject) => {
                return group.sendMessage({ ...messageObject, silent: true }, { skip_push: true })
              }}
              MessageText={props => <MessageText {...props} showText />}
              Card={AttachmentCard}
              UrlPreview={URLReview}
              SendButton={props => (
                <SendButton
                  {...props}
                  onSendMessage={t => {
                    Keyboard.dismiss()
                    Firestore.Group.updateThreadViewer(groupId, threadId, replyCount.current + 1)
                    Firestore.Group.updateScore(ScoreDailyActionType.SEND_DISCUSSION_MESSAGE, groupId)
                    replyCount.current = replyCount.current + 1
                    Analytics.event(Constants.EVENTS.MESSAGE_REPLIED)
                  }}
                />
              )}
              myMessageTheme={withMyMessageTheme(color)}
              keyboardBehavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_HEIGHT + insets.top : undefined}
              allowThreadMessagesInChannel={false}
              AttachButton={addVerseIcon}
              CommandsButton={() => null}>
              <Thread
                autoFocus={true}
                additionalMessageListProps={{
                  DateHeader: () => null,
                  FooterComponent: () => null,
                  StickyHeader: () => <Title />,
                }}
                additionalMessageInputProps={{
                  additionalTextInputProps: {
                    autoFocus: Platform.select({ android: false, ios: false }),
                    editable: true,
                    placeholder: 'Type a message...',
                  },
                }}
              />
            </Channel>
          </Chat>
        </Animated.View>
      </Container>
      {isShowPassage ? (
        <Portal>
          <VersesPickerModal
            onClosed={() => {
              setShowPassage(false)
            }}
            customPassages={chapters}
            onPressSend={onPressSendVerses}
          />
        </Portal>
      ) : null}
    </>
  )
}

ThreadScreen.defaultProps = {}

const s = StyleSheet.create({
  flex: {
    flex: 1,
    marginBottom: 10,
    marginHorizontal: Metrics.insets.horizontal,
  },
  flexGrow: { flexGrow: 1 },
  header: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Metrics.insets.horizontal,
    marginBottom: 19,
  },
  titleContainer: {
    paddingHorizontal: 26,
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    width: Metrics.screen.width - 32,
    alignSelf: 'center',
  },
  addIcon: { marginLeft: 0 },
})

export default ThreadScreen
