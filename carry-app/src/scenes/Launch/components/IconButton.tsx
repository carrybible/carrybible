/**
 * Icon Button
 *
 * @format
 *
 */

import React from 'react'
import { TouchableOpacity, StyleProp, ViewStyle, ImageStyle } from 'react-native'
import Icon from '@components/Icon'
import { H3 } from '@components/Typography'
import useTheme from '@hooks/useTheme'

interface Props {
  title?: string
  icon: string
  size?: number
  style?: StyleProp<ViewStyle>
  iconStyle?: StyleProp<ImageStyle>
  onPress?: any
  font?: string
}

const IconButton: React.FC<Props> = props => {
  const { color } = useTheme()
  return (
    <TouchableOpacity style={[{ alignItems: 'center', padding: 8 }, props.style]} onPress={props.onPress}>
      <Icon
        source={props.icon}
        color={color.text}
        size={props.size || 28}
        style={[{ marginBottom: 10 }, props.iconStyle]}
        font={props.font}
      />
      {props.title ? <H3 color="text">{props.title}</H3> : null}
    </TouchableOpacity>
  )
}

IconButton.defaultProps = {
  size: 28,
}

export default IconButton
