import Icon from '@components/Icon'
import React, { useEffect, useRef } from 'react'
import { InteractionManager, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StackScreenProps } from '@react-navigation/stack'
import HighlightText from '@sanar/react-native-highlight-text'
import I18n from 'i18n-js'

import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { TYPES } from '@redux/actions'
import useDirectMessageChannelId from '@hooks/useDirectMessageChannelId'
import { StreamIO } from '@shared/index'
import { RootState } from '@dts/state'
import { H1, H2, Text, Title } from '@components/Typography'
import Avatar from '@components/Avatar'

type ParamProps = {
  mode: 'key_contributor' | 'quite_member'
  user: {
    id: string
    name: string
    avatar: string
  }
}

const ModeConfig = {
  key_contributor: {
    icon: '📈',
    title: 'text.keyContributorTitle',
    subTitle: 'text.Try sending a message to\nencourage their activity ✨',
    defaultMessages: ['text.key_constructor_default_msg_1', 'text.key_constructor_default_msg_2'],
  },
  quite_member: {
    icon: '📉',
    title: 'text.quiteMemberTitle',
    subTitle: 'text.Try sending a message \nto check in ✨',
    defaultMessages: ['text.quite_member_default_msg_1', 'text.quite_member_default_msg_2'],
  },
}

type Props = StackScreenProps<{ MemberActivityPrompt: ParamProps }, 'MemberActivityPrompt'>

const MemberActivityPrompt: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const [channel, setChannel] = React.useState<any>(null)

  const { user, mode } = props.route.params
  const config = ModeConfig[mode]

  const channelId = useDirectMessageChannelId(user.id)

  useEffect(() => {
    modal.current?.open()
    dispatch({
      type: TYPES.ME.UPDATE,
      payload: {
        latestMemberActivityPromptModalShow: Date.now(),
      },
    })
  }, [dispatch])

  useEffect(() => {
    const createChannel = async () => {
      const newChannel = StreamIO.client.channel('messaging', channelId, {
        name: 'Direct message',
        members: [me.uid, user.id],
        groupId: group.id,
      })
      await newChannel.watch()
      setChannel(newChannel)
    }

    createChannel()
  }, [channelId, group.id, me.uid, user.id])

  const handleClose = () => {
    modal.current?.close()
  }

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      NavigationRoot.pop()
    })
  }

  const handleSendMessage = async message => {
    if (!channel) {
      return
    }
    await channel.sendMessage({
      text: message,
    })
    dispatch({ type: TYPES.GROUP.RELOAD_DIRECT_MESSAGES })
  }

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      onClosed={onClosed}
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
      }}
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}>
      <View style={styles.contentWrapper}>
        <Title>{config.icon}</Title>

        <HighlightText
          style={styles.title}
          highlightStyle={{ color: color.accent }}
          // @ts-ignore
          searchWords={[user.name]}
          textToHighlight={I18n.t(config.title, { nameValue: user.name })}
          textComponent={H1}
        />

        <Avatar size={100} url={user.avatar} borderWidth={5} borderColor={color.whiteSmoke} />
        <H2 align="center" bold={false} style={styles.subTitle}>
          {I18n.t(config.subTitle)}
        </H2>

        {config.defaultMessages.map(message => (
          <SuggestMessage key={message} message={I18n.t(message)} closeModal={handleClose} sendMessage={handleSendMessage} />
        ))}

        <WriteOwnMessage closeModal={handleClose} sendMessage={handleSendMessage} />
      </View>
    </Modalize>
  )
}

const SuggestMessage: React.FC<{
  message: string
  closeModal: () => void
  sendMessage: (message: string) => void
}> = ({ message, closeModal, sendMessage }) => {
  const { color } = useTheme()
  const handleSendMessage = async () => {
    await sendMessage(message)
    closeModal()
    toast.success(I18n.t('text.Sent'))
  }
  return (
    <TouchableOpacity
      style={[styles.suggestMessageWrapper, { borderColor: color.whiteSmoke }]}
      activeOpacity={0.5}
      onPress={handleSendMessage}>
      <Text color="gray" style={styles.suggestMessageText}>
        {message}
      </Text>
      <Icon color="accent" size={22} source={require('@assets/icons/icons8-sent.png')} />
    </TouchableOpacity>
  )
}

const WriteOwnMessage = ({ closeModal, sendMessage }) => {
  const { color } = useTheme()
  const [message, setMessage] = React.useState('')
  const isDisable = message.length === 0
  const handleSendMessage = async () => {
    await sendMessage(message)
    closeModal()
    toast.success(I18n.t('text.Sent'))
  }
  return (
    <View
      style={[
        styles.writeMessageWrapper,
        {
          borderColor: color.whiteSmoke,
        },
      ]}>
      <TextInput
        placeholder={I18n.t('text.Write your own')}
        placeholderTextColor={color.gray}
        value={message}
        onChangeText={setMessage}
        style={[
          styles.writeMessageInput,
          {
            color: color.text,
          },
        ]}
        returnKeyType="go"
        returnKeyLabel={I18n.t('text.Sent label')}
        onSubmitEditing={handleSendMessage}
      />
      <TouchableOpacity disabled={isDisable} onPress={handleSendMessage}>
        <Icon color={isDisable ? 'whiteSmoke' : 'accent'} size={22} source={require('@assets/icons/icons8-sent.png')} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentWrapper: {
    paddingTop: 55,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 20,
    marginBottom: 40,
  },
  suggestMessageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  suggestMessageText: { flex: 1 },
  writeMessageWrapper: {
    width: '100%',
    marginTop: 50,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 120,
    paddingVertical: 19,
    paddingLeft: 25,
    paddingRight: 18,
    alignItems: 'center',
  },
  writeMessageInput: { flex: 1, marginRight: 10 },
})

export default MemberActivityPrompt
