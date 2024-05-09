import Button from '@components/Button'
import Loading from '@components/Loading'
import AttachmentCard from '@components/StreamIO/AttachmentCard'
import CustomMessageSimple from '@components/StreamIO/CustomMessageSimple'
import { MessageText } from '@components/StreamIO/MessageText'
import { withMyMessageTheme } from '@components/StreamIO/MyMessageTheme'
import SendButton from '@components/StreamIO/SendButton'
import { Text } from '@components/Typography'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import { BibleFormatter, Config, Constants, Firestore, StreamIO } from '@shared/index'
import Metrics from '@shared/Metrics'
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Keyboard, Platform, StyleSheet, View } from 'react-native'
import { Portal } from 'react-native-portalize'
import { useSelector } from 'react-redux'
import { Message } from 'stream-chat'
import { Channel, Chat, Message as MessageChat, MessageAvatar, Thread } from 'stream-chat-react-native'
import { ActivityContext } from '../../StudyActivityScreen'
import VersesPickerModal from './VersesPickerModal'

const ActivityQuestion: FC<{ onPressNext: (onlyMaskAsRead?: boolean) => void; activity: StudyPlan.QuestionAct; isFollowUp?: boolean }> = ({
  activity,
  isFollowUp,
  onPressNext,
}) => {
  const { plan } = useContext(ActivityContext)
  const g = useSelector<RootState, RootState['group']>(state => state.group)
  const Analytics = useAnalytic()
  const groupId = plan?.targetGroupId || g.id || ''
  const threadId = activity?.messageId || ''

  const { color } = useTheme()
  const [thread, setThread] = useState<any>()
  const [group, setGroup] = useState<any>()
  const replyCount = useRef(0)
  const [isShowPassage, setShowPassage] = useState(false)
  const [titleFontSize, setTitleFontSize] = useState(0)

  const { landscape } = useScreenMode()

  const keyboardPadding = useKeyboardPadding()
  const isShowAddVerse = (activity.customPassages?.length || 0) > 0

  useEffect(() => {
    let channelEvent = null
    const initData = async () => {
      const t = await StreamIO.client.getMessage(threadId)
      setThread(t.message)
      const groupChannel = StreamIO.client.channel('messaging', groupId)
      replyCount.current = t.message.reply_count
      channelEvent = groupChannel.on(e => {
        if (e.message?.reply_count) replyCount.current = e.message?.reply_count
      })
      setGroup(groupChannel)
    }
    initData()
    return () => channelEvent?.unsubscribe?.()
  }, [])

  const onSelectVersePress = useCallback(() => {
    setShowPassage(true)
  }, [])

  const onTextLayout = e => {
    const { lines } = e.nativeEvent
    if (titleFontSize === 0) {
      let fontSize = 22 - lines.length * 2
      if (lines.length > 5) fontSize = 10
      setTitleFontSize(fontSize)
    }
  }

  const listStyle = useMemo(() => {
    return {
      // workaround to make right alignment reaction list position correctly
      screenPadding: Metrics.insets.horizontal * 2.7,
      messageList: {
        container: {
          flex: 1,
          width: Metrics.screen[landscape ? 'height' : 'width'] - Metrics.insets.horizontal * 2,
          maxWidth: '96%',
          backgroundColor: color.id === 'light' ? color.white : color.black,
          marginHorizontal: Metrics.insets.horizontal,
          marginBottom: Metrics.insets.horizontal,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          paddingHorizontal: 0,
          paddingBottom: 0,
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
          borderColor: undefined,
          borderWidth: undefined,
          borderRadius: 20,
          borderTopWidth: 0,
          paddingTop: 0,
          alignItems: 'center',
          paddingHorizontal: Metrics.insets.horizontal,
          marginHorizontal: Metrics.insets.horizontal,
          ...(!isShowAddVerse ? { paddingLeft: 0, marginLeft: 10 } : {}),
        },
        inputBoxContainer: {
          backgroundColor: color.id === 'light' ? color.white : color.black,
          borderRadius: 20,
          borderWidth: 0,
          marginRight: -60,
          paddingRight: 70,
        },
        inputBox: {
          color: color.text,
          fontFamily: null,
        },
        sendButtonContainer: {
          paddingTop: Platform.select({ android: 0, ios: 5 }),
          height: 40,
        },
        sendButton: {
          backgroundColor: 'pink',
        },
      },
    }
  }, [landscape, color, isShowAddVerse])

  const ChatView = useMemo(() => {
    return (
      <>
        <View style={[s.header, { backgroundColor: color.id === 'light' ? color.white : color.black, borderBottomColor: color.gray7 }]}>
          <Text
            align="center"
            // eslint-disable-next-line react-native/no-inline-styles
            style={[s.title, { fontSize: titleFontSize, color: titleFontSize === 0 ? 'transparent' : color.text }]}
            bold
            onTextLayout={onTextLayout}>
            {activity.question.split('{{nameValue}}')[0]}
            <Text
              align="center"
              // eslint-disable-next-line react-native/no-inline-styles
              style={[s.title, { fontSize: titleFontSize, color: titleFontSize === 0 ? 'transparent' : color.accent }]}
              bold
              onTextLayout={onTextLayout}>
              {activity.possessiveName}
            </Text>
            {activity.question.split('{{nameValue}}')[1] || ''}
          </Text>
        </View>
        <Animated.View style={s.flex}>
          <View
            style={[
              {
                backgroundColor: color.id === 'light' ? color.white : color.black,
              },
              s.loadingContainer,
            ]}>
            <Loading style={s.loading} />
          </View>
          {group && thread && (
            <Chat style={listStyle} client={StreamIO.client} i18nInstance={StreamIO.streamI18n}>
              <Channel
                threadList={true}
                disableKeyboardCompatibleView={true}
                channel={group}
                thread={thread}
                Card={props => <AttachmentCard goal={plan} question={activity?.question} onlyGoal {...props} />}
                Message={props => {
                  const isQuotedReply = props?.message?.groupStyles === undefined
                  return isQuotedReply ? null : <MessageChat {...props} />
                }}
                MessageText={MessageText}
                MessageSimple={CustomMessageSimple}
                MessageAvatar={props => <MessageAvatar {...props} showAvatar={true} />}
                AttachButton={
                  isFollowUp
                    ? undefined
                    : () =>
                        isShowAddVerse ? (
                          <Button.Icon
                            icon={require('@assets/icons/ic-add-verse.png')}
                            color={color.accent2}
                            size={24}
                            onPress={onSelectVersePress}
                            style={s.addIcon}
                          />
                        ) : null
                }
                InlineUnreadIndicator={() => null}
                InlineDateSeparator={() => null}
                DateHeader={() => null}
                hasCommands={false}
                SendButton={props => (
                  <SendButton
                    {...props}
                    onSendMessage={t => {
                      Keyboard.dismiss()
                      if (isFollowUp) {
                        Analytics.event(Constants.EVENTS.ACTIONS_STEP.SHARE_MESSAGE_TO_FOLLOW_UP_HIGHLIGHT)
                      }
                      Firestore.Group.updateThreadViewer(groupId, threadId, replyCount.current + 1)
                      replyCount.current = replyCount.current + 1
                      Firestore.Group.updateScore(ScoreDailyActionType.ANSWER_QUESTION, groupId)
                      onPressNext(true)
                    }}
                  />
                )}
                myMessageTheme={withMyMessageTheme(color)}
                allowThreadMessagesInChannel={false}
                doSendMessageRequest={(channelId, messageObject) => {
                  Analytics.event(Constants.EVENTS.GOAL.ANSWERED_A_QUESTION)
                  return group.sendMessage({ ...messageObject, silent: true }, { skip_push: true })
                }}>
                <Thread
                  additionalMessageListProps={{
                    FooterComponent: () => null,
                    additionalFlatListProps: {
                      // Temporary fix issue that the chat show upside down with new version of stream chat
                      // style: {
                      //   backgroundColor: color.id === 'light' ? color.white : color.black,
                      //   width: Metrics.screen.width - Metrics.insets.horizontal * 2,
                      //   borderTopLeftRadius: 20,
                      //   borderTopRightRadius: 20,
                      // },
                    },
                  }}
                  additionalMessageInputProps={{
                    additionalTextInputProps: {
                      // Don't know why but if we set autoFocus to false on iOS the message input part will
                      // disappear
                      autoFocus: Platform.select({ android: false, ios: false }),
                      editable: true,
                      placeholder: 'Type a message...',
                    },
                  }}
                />
              </Channel>
            </Chat>
          )}
        </Animated.View>
      </>
    )
  }, [group, thread, titleFontSize, onPressNext, listStyle, color])

  async function onPressSendVerses(choosenVerse, bibleType) {
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

      await group?.sendMessage(message)
      await Firestore.Group.updateThreadViewer(groupId, threadId, replyCount.current + 1)
      return
    } else {
      if (isFollowUp) {
        Analytics.event(Constants.EVENTS.ACTIONS_STEP.SHARE_MESSAGE_TO_FOLLOW_UP_HIGHLIGHT)
      }
      const rootIdArray: number[] = Array.from(choosenVerse.selected)
      const osisStr = BibleFormatter.toOsis(rootIdArray)
      const message: Message = {
        text: choosenVerse.verses || '',
        parent_id: threadId,
        attachments: [{ osis: osisStr, rootIdStr: rootIdArray.join(','), rootId: rootIdArray[0], type: 'bible' }],
      }
      const channel = await StreamIO.channel.get(groupId, false)
      await channel?.sendMessage(message)
    }
    // Count as finish this step by share verse
    onPressNext(true)
  }

  return (
    <>
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
        {ChatView}
      </Animated.View>
      {isShowPassage ? (
        <Portal>
          <VersesPickerModal
            onClosed={() => {
              setShowPassage(false)
            }}
            customPassages={activity.customPassages}
            onPressSend={onPressSendVerses}
          />
        </Portal>
      ) : null}
    </>
  )
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    marginLeft: Metrics.insets.horizontal,
    marginRight: Metrics.insets.horizontal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: Metrics.insets.horizontal,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    minHeight: 70,
  },
  addIcon: { marginLeft: 0 },
  title: {
    paddingHorizontal: 30,
  },
  loadingContainer: {
    left: Metrics.insets.horizontal,
    right: Metrics.insets.horizontal,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'absolute',
    top: 0,
    bottom: 67,
  },
  loading: { backgroundColor: 'transparent' },
})

export default ActivityQuestion
