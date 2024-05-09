/**
 * Icon Button
 *
 * @format
 *
 */

import React from 'react'
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native'
import Icon from '@components/Icon'
import { H3 } from '@components/Typography'
import useTheme from '@hooks/useTheme'

interface Props {
  title: string
  icon: string
  size?: number
  style?: StyleProp<ViewStyle>
  onPress?: any
}

const IconButton: React.FC<Props> = props => {
  const { color } = useTheme()
  return (
    <TouchableOpacity style={[{ alignItems: 'center', padding: 8 }, props.style]} onPress={props.onPress}>
      <Icon source={props.icon} color={color.white} size={props.size || 28} style={{ marginBottom: 10 }} />
      <H3 color="white">{props.title}</H3>
    </TouchableOpacity>
  )
}

IconButton.defaultProps = {
  size: 28,
}

export default IconButton
