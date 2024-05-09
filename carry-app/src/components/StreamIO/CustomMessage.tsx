/* eslint-disable react-native/no-inline-styles */
import React from 'react'
import { Dimensions, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { Message, MessageProps } from 'stream-chat-react-native'
import I18n from 'i18n-js'

import { RootState } from '@dts/state'
import { GroupActionAttachment, GroupActionContentViewer } from '@scenes/GroupActions/components/GroupActionDetailViewer'
import PrivateChatContext from '@scenes/Common/PrivateChatContext'
import useTheme from '@hooks/useTheme'
import { Text } from '../Typography'
import { NavigationRoot } from '@scenes/root'
import { Constants } from '@shared/index'

const WINDOW = Dimensions.get('window')
const SCALE = 0.35
const WIDTH_HEIGHT_RATIO = 1.5

const WIDTH = WINDOW.width
const HEIGHT = WIDTH_HEIGHT_RATIO * WIDTH
const ATTACHMENT_WIDTH = SCALE * WIDTH
const ATTACHMENT_HEIGHT = WIDTH_HEIGHT_RATIO * ATTACHMENT_WIDTH

const CustomMessage = React.forwardRef<typeof Message, MessageProps>((props, ref) => {
  const { message } = props
  const groupActionAttachment = React.useMemo(() => {
    const result = message.attachments?.find(attachment => attachment.type === 'groupAction')
    return result ? result : null
  }, [message.attachments]) as GroupActionAttachment
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const friend = React.useContext(PrivateChatContext)
  const isMyMessage = message.user?.id === me.uid
  const creatorInfo = React.useMemo(
    () => ({
      image: (isMyMessage ? friend?.image : me.image) ?? '',
      name: (isMyMessage ? friend?.name : me.name) ?? '',
      userId: (isMyMessage ? friend?.id : me.uid) ?? '',
    }),
    [friend, me, isMyMessage],
  )
  const title = React.useMemo(() => {
    const possessiveName = friend?.name?.endsWith('s') ? `${friend?.name}'` : `${friend?.name}'s`

    if (groupActionAttachment?.groupActionType === 'prayer') {
      return isMyMessage ? I18n.t('text.You replied to prayer', { nameValue: possessiveName }) : I18n.t('text.Replied to your prayer')
    }
    return isMyMessage ? I18n.t('text.You replied to gratitude', { nameValue: possessiveName }) : I18n.t('text.Replied to your gratitude')
  }, [friend?.name, groupActionAttachment?.groupActionType, isMyMessage])

  const { color } = useTheme()
  const { textTranslate, textStyle, wrapperAttachmentStyle, absoluteAttachmentStyle, translateXBack } = useAttachmentStyle(
    isMyMessage ? 'right' : 'left',
  )

  if (!groupActionAttachment) {
    // @ts-ignore Ignore ref error
    return <Message ref={ref} {...props} />
  }

  const { groupActionType, content, groupId, id } = groupActionAttachment

  return (
    <View>
      <Text
        color="gray3"
        style={[
          {
            transform: [{ translateX: textTranslate }],
            marginBottom: 5,
            marginTop: 5,
          },
          textStyle,
        ]}>
        {title}
      </Text>
      <View
        style={[
          {
            width: ATTACHMENT_WIDTH,
            height: ATTACHMENT_HEIGHT,
            marginBottom: 10,
            marginTop: 5,
          },
          wrapperAttachmentStyle,
        ]}>
        <TouchableOpacity
          onPress={() => {
            NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.DETAIL, {
              mode: 'read',
              initGroupActionId: id,
              groupId: groupId,
            })
          }}
          activeOpacity={0.7}
          style={[
            {
              position: 'absolute',
              top: 0,
              width: WIDTH,
              height: HEIGHT,
              transform: [
                {
                  translateX: -WIDTH * 0.5,
                },
                { translateY: -HEIGHT * 0.5 },
                { scale: SCALE },
                { translateX: translateXBack },
                { translateY: HEIGHT * 0.5 },
              ],
            },
            absoluteAttachmentStyle,
          ]}>
          <View style={{ borderLeftWidth: 3 / SCALE, borderLeftColor: color.gray7 }} />
          <View style={{ width: 15 / SCALE }} />
          <GroupActionContentViewer
            type={groupActionType}
            content={content}
            creatorInfo={creatorInfo}
            isRenderInChat
            style={{ borderWidth: 1, borderRadius: 20, borderColor: color.gray3 }}
          />
        </TouchableOpacity>
      </View>
      {/* @ts-ignore  Ignore ref error */}
      <Message ref={ref} {...props} />
    </View>
  )
})

const useAttachmentStyle = (mode: 'left' | 'right') => {
  const style: {
    // eslint-disable-next-line no-unused-vars
    [key in 'left' | 'right']: {
      textTranslate: number
      translateXBack: number
      textStyle: TextStyle
      wrapperAttachmentStyle: ViewStyle
      absoluteAttachmentStyle: ViewStyle
    }
  } = {
    left: {
      textTranslate: WIDTH * 0.1 * SCALE,
      translateXBack: WIDTH * 0.6,
      textStyle: {
        alignSelf: 'flex-start',
      },
      wrapperAttachmentStyle: {
        alignSelf: 'flex-start',
      },
      absoluteAttachmentStyle: {
        flexDirection: 'row',
      },
    },
    right: {
      textTranslate: -WIDTH * 0.1 * SCALE,
      translateXBack: WIDTH * 0.4,
      textStyle: {
        alignSelf: 'flex-end',
      },
      wrapperAttachmentStyle: {
        alignSelf: 'flex-end',
      },
      absoluteAttachmentStyle: {
        flexDirection: 'row-reverse',
      },
    },
  }

  return {
    ...style[mode],
  }
}

export default CustomMessage
