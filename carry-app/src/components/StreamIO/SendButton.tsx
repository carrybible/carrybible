import React from 'react'
import Button from '@components/Button'
import { useMessageInputContext } from 'stream-chat-react-native'
import useTheme from '@hooks/useTheme'
import { StyleSheet } from 'react-native'

const SendButton = props => {
  const { color } = useTheme()
  const { sendMessage } = useMessageInputContext()
  const handleSend = () => {
    sendMessage()
    if (props.onSendMessage) props.onSendMessage()
  }

  return (
    <Button.Icon
      color={props.disabled ? color.gray : color.accent2}
      disabled={props.disabled}
      icon={require('@assets/icons/icons8-sent.png')}
      size={28}
      onPress={handleSend}
      style={s.btn}
    />
  )
}

const s = StyleSheet.create({
  btn: { marginLeft: 5 },
})

export default SendButton
