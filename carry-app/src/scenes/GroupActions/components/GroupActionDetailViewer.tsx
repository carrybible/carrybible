import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import { H2, Text, Title } from '@components/Typography'
import { GroupActionsType } from '@dts/groupAction'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import useDirectMessageChannelId from '@hooks/useDirectMessageChannelId'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import { Firestore, StreamIO } from '@shared/index'
import Metrics from '@shared/Metrics'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { FC, useEffect, useMemo } from 'react'
import { Animated, Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

export type GroupActionAttachment = {
  type: 'groupAction'
  groupActionType: GroupActionsType
  groupId: string
  id: string
  content: string
}

export type GroupActionInfoType = NonNullable<RootState['groupActions']['data']>[number]

export type Props = {
  info: GroupActionInfoType
  onSended?: () => void
}

const GroupActionDetailViewer: FC<Props> = ({ info, onSended }) => {
  const dispatch = useDispatch()
  const Analytics = useAnalytic()

  useEffect(() => {
    if (info.unread) {
      dispatch({
        type: TYPES.GROUP_ACTIONS.VIEW,
        payload: {
          id: info.id,
        },
      })
    }
  }, [dispatch, info.id, info.unread])
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const channelId = useDirectMessageChannelId(info.creator)
  const [channel, setChannel] = React.useState<any>(null)

  useEffect(() => {
    const createChannel = async () => {
      const newChannel = StreamIO.client.channel('messaging', channelId, {
        name: 'Direct message',
        members: [me.uid, info.creator],
        groupId: group.id,
      })
      await newChannel.watch()
      setChannel(newChannel)
    }

    createChannel()
  }, [channelId, group.id, info.creator, me.uid])

  const handleSendMessage = async (message: string) => {
    if (!channel) {
      return
    }
    const attachmentData: GroupActionAttachment = {
      type: 'groupAction',
      groupActionType: info.type,
      groupId: group.id,
      id: info.id,
      content: info.content,
    }
    channel.sendMessage({
      text: message,
      attachments: [attachmentData],
    })
    Firestore.Group.updateScore(ScoreDailyActionType.REACT_GROUP_ACTION, group.id)
    if (onSended) {
      await wait(500)
      onSended()
    }
  }

  const keyboardPadding = useKeyboardPadding()
  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: keyboardPadding }] }]}>
      <GroupActionContentViewer type={info.type} creatorInfo={info.creatorInfo} content={info.content} requestText={info?.requestText} />
      <ReactSection key={info.id} type={info.type} disable={info.creator === me.uid} sendMessage={handleSendMessage} />
    </Animated.View>
  )
}

export type ActionContentProps = {
  type: GroupActionsType
  content: string
  creatorInfo: GroupActionInfoType['creatorInfo']
  isRenderInChat?: boolean
  style?: ViewStyle
  requestText?: string
}

export const GroupActionContentViewer: FC<ActionContentProps> = ({
  type,
  content,
  creatorInfo,
  isRenderInChat = false,
  style,
  requestText,
}) => {
  const { color } = useTheme()
  const { landscape } = useScreenMode()
  return (
    <View
      style={[
        styles.contentScrollView,
        {
          backgroundColor: color.id === 'light' ? color.white : color.black,
        },
        style,
      ]}>
      {landscape ? (
        <ScreenView>
          <View style={styles.center}>
            <TitleDetail type={type} creatorInfo={creatorInfo} shouldCheckCurrentUser={!isRenderInChat} requestText={requestText} />
            <Avatar
              url={creatorInfo.image}
              size={36}
              style={[styles.avatar, landscape ? styles.avatarLand : {}, { backgroundColor: color.whiteSmoke }]}
              touchable={false}
            />
          </View>
          <View style={styles.center}>
            <Text color="gray8" align="center" style={styles.contentText} numberOfLines={isRenderInChat ? 5 : undefined}>
              {content}
            </Text>
          </View>
        </ScreenView>
      ) : (
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewerWrapper}>
          <View style={styles.premiumIconWrapper}>
            <View style={styles.flex1} />
          </View>
          <View style={styles.contentWrapper}>
            <TitleDetail type={type} creatorInfo={creatorInfo} shouldCheckCurrentUser={!isRenderInChat} requestText={requestText} />
            <Avatar url={creatorInfo.image} size={135} style={[styles.avatar, { backgroundColor: color.whiteSmoke }]} touchable={false} />
            <Text color="gray8" align="center" style={styles.contentText} numberOfLines={isRenderInChat ? 5 : undefined}>
              {content}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const TitleDetail = ({
  type,
  creatorInfo,
  shouldCheckCurrentUser,
  requestText,
}: {
  type: string
  creatorInfo: GroupActionInfoType['creatorInfo']
  shouldCheckCurrentUser: boolean
  requestText?: string
}) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)

  const question = useMemo(() => {
    if (creatorInfo.userId === me.uid && shouldCheckCurrentUser) {
      return (
        <H2 bold align="center" style={styles.titleText}>
          {type === 'prayer' ? I18n.t('text.Your prayer request') : I18n.t('text.Your gratitude entry')}
        </H2>
      )
    }
    if (requestText) {
      const texts = requestText.split('{{name}}')
      return (
        <>
          <Text bold align="center" style={styles.titleText}>
            {texts[0]}
            <H2 align="center" bold color={'accent'}>
              {creatorInfo.name}
            </H2>{' '}
            {texts[1]}
          </Text>
        </>
      )
    }
    return (
      <Text bold align="center" style={styles.titleText}>
        {type === 'prayer' ? I18n.t('text.Can you pray for') : I18n.t('text.Celebrate with')}
        {'\n'}
        <H2 align="center" bold color={'accent'}>
          {creatorInfo.name}
        </H2>{' '}
        {I18n.t('text.today')}
      </Text>
    )
  }, [creatorInfo, requestText, type, shouldCheckCurrentUser, me])

  return (
    <View style={styles.titleWrapper}>
      <Title style={styles.iconText}>{type === 'prayer' ? '🙏' : '🎉'}</Title>
      {question}
    </View>
  )
}

const ReactSection = ({ type, disable = false, sendMessage }) => {
  const { color } = useTheme()
  const [reactMessage, setReactMessage] = React.useState('')
  const iconText = type === 'prayer' ? '🙏' : '🎉'
  const Analytics = useAnalytic()

  const handleReact = (message: string) => {
    sendMessage(message)
    const isReact = ['🙏', '🎉'].includes(message)
    if (isReact || message) {
      toast.success(isReact ? I18n.t('text.Reaction sent') : I18n.t('text.Message sent'))
    }
    Keyboard.dismiss()
    if (!isReact) {
      setReactMessage('')
    }
  }

  return (
    <View
      style={[
        styles.reactWrapper,
        // eslint-disable-next-line react-native/no-inline-styles
        {
          opacity: disable ? 0.5 : 1,
        },
      ]}
      pointerEvents={disable ? 'none' : 'auto'}>
      <TouchableOpacity
        style={[
          styles.btnReact,
          {
            backgroundColor: color.id === 'light' ? color.white : color.black,
          },
        ]}
        onPress={() => handleReact(iconText)}>
        <Text>{iconText}</Text>
      </TouchableOpacity>
      <View style={[styles.contentInput, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
        <TextInput
          style={[styles.textInput, { color: color.text }]}
          value={reactMessage}
          // https://github.com/facebook/react-native/issues/22078
          onChangeText={text => setReactMessage(text.replace(/\n/g, ''))}
          multiline={true}
          placeholder={I18n.t('text.Type a message')}
          placeholderTextColor={color.gray2}
          autoFocus={false}
        />
        <TouchableOpacity disabled={disable} style={styles.sendBtn} onPress={() => handleReact(reactMessage)}>
          <Icon color={disable ? 'whiteSmoke' : 'accent'} size={20} source={require('@assets/icons/icons8-sent.png')} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: Metrics.safeArea.bottom,
  },
  viewerWrapper: {
    paddingTop: Metrics.insets.horizontal * 2,
    paddingHorizontal: Metrics.insets.horizontal,
    alignItems: 'center',
  },
  premiumIconWrapper: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    marginBottom: 25,
    height: 145,
    width: 145,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLand: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginBottom: 0,
    marginTop: -20,
  },
  contentText: {
    marginHorizontal: 40,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    marginBottom: 23,
    fontSize: 36,
  },
  titleText: {
    marginHorizontal: 40,
  },
  reactWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnReact: {
    borderRadius: 30,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInput: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
  },
  textInput: {
    flex: 1,
    fontWeight: '400',
    marginLeft: 20,
  },
  sendBtn: {
    marginRight: 10,
  },
  contentScrollView: {
    flex: 1,
    borderRadius: 20,
    marginBottom: 10,
    paddingBottom: 20,
  },
})

export default GroupActionDetailViewer
