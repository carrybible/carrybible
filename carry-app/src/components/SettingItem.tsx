import React from 'react'
import { StyleProp, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native'

import Icon from '@components/Icon'
import { H3 } from '@components/Typography'
import useTheme from '@hooks/useTheme'

const SettingItem: React.FC<{
  icon: string
  text: string
  tintColor?: string
  textColor?: string
  onPress?: () => void
  containerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}> = ({ icon, text, onPress, tintColor, textColor, containerStyle, textStyle }) => {
  const { color } = useTheme()
  return (
    <TouchableOpacity onPress={onPress} style={[s.container, containerStyle]}>
      <Icon source={icon} color={tintColor ?? color.text} size={22} />
      <H3 style={[s.text, { color: textColor ?? color.text }, textStyle]}>{text}</H3>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 29 },
  text: { marginLeft: 16 },
})

export default SettingItem
