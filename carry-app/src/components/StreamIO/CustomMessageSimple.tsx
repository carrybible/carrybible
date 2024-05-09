import React, { useState } from 'react'
import { View } from 'react-native'

import { useTheme, useMessagesContext, useMessageContext } from 'stream-chat-react-native-core'

const CustomMessageSimple = () => {
  const { alignment, channel, groupStyles, hasReactions, message } = useMessageContext()
  const { enableMessageGroupingByUser, MessageAvatar, MessageContent, ReactionList } = useMessagesContext()

  const {
    theme: {
      messageSimple: { container },
    },
  } = useTheme()

  const [messageContentWidth, setMessageContentWidth] = useState(0)

  const isVeryLastMessage = channel?.state.messages[channel?.state.messages.length - 1]?.id === message?.id

  const hasMarginBottom = groupStyles.includes('single') || groupStyles.includes('bottom')

  const showReactions = hasReactions && ReactionList

  return (
    <View
      style={[
        // eslint-disable-next-line react-native/no-inline-styles
        {
          alignItems: 'flex-end',
          flexDirection: 'row',
          justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end',
          marginBottom: hasMarginBottom ? (isVeryLastMessage && enableMessageGroupingByUser ? 30 : 8) : 0,
          marginTop: showReactions ? 2 : 0,
        },
        container,
      ]}
      testID="message-simple-wrapper"
    >
      {alignment === 'left' && <MessageAvatar />}
      <MessageContent setMessageContentWidth={setMessageContentWidth} />
      {alignment === 'right' && <MessageAvatar />}
      {showReactions && <ReactionList messageContentWidth={messageContentWidth} />}
    </View>
  )
}

const MemoizedMessageSimple = React.memo(CustomMessageSimple)

export default MemoizedMessageSimple
