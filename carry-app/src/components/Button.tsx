/**
 * Button Component
 *
 * @format
 *
 */

import React from 'react'
import { Insets, StyleProp, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native'
import Icon from './Icon'
import Loading from './Loading'
import { Text } from './Typography'

type IProps = {
  text: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  loading?: boolean
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/ban-types
  icon?: Object
  font?: string
  iconColor?: string
  iconSize?: number
  iconPosition?: 'left' | 'right'
  showLoading?: boolean
}

const Button: React.FC<IProps> = props => {
  function renderIcon() {
    if (props.icon) {
      return (
        <View style={s.icon__container}>
          {!!props.loading && props.showLoading ? (
            <Loading
              centered
              spinnerSize={16}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                height: props.iconSize,
                width: props.iconSize,
                backgroundColor: 'transparent',
              }}
            />
          ) : (
            <Icon
              source={props.icon}
              size={props.iconSize}
              color={props.iconColor}
              style={{
                tintColor: props.iconColor,
              }}
              font={props.font}
            />
          )}
        </View>
      )
    }

    return null
  }

  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={[s.container, props.style, props.disabled || props.loading ? s.disabled : {}]}
      disabled={props.disabled || props.loading}
      activeOpacity={0.8}
      delayPressIn={0.1}
      hitSlop={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      {props.iconPosition === 'left' && renderIcon()}
      <Text style={[s.text, props.textStyle]}>{props.text}</Text>
      {props.iconPosition === 'right' && renderIcon()}
    </TouchableOpacity>
  )
}

Button.defaultProps = {
  disabled: false,
  loading: false,
  iconSize: 32,
  showLoading: false,
  iconPosition: 'left',
}

/**
 * Icon Button Component
 */
export type IconButtonProps = {
  style?: StyleProp<ViewStyle>
  icon: any
  color?: string
  size?: number
  onPress?: () => void
  hitSlop?: Insets
  width?: number
  disabled?: boolean
  font?: string
}

const IconButton: React.FC<IconButtonProps> = props => {
  return (
    <TouchableOpacity
      // eslint-disable-next-line react-native/no-inline-styles
      style={[s.button__icon, { width: props.width, height: props.width }, { opacity: props.disabled ? 0.4 : 1 }, props.style]}
      onPress={props.onPress}
      activeOpacity={0.8}
      hitSlop={props.hitSlop}
      disabled={props.disabled}>
      <Icon source={props.icon} size={props.size} color={props.color} font={props.font} />
    </TouchableOpacity>
  )
}

IconButton.defaultProps = {
  size: 20,
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  text: {
    textAlign: 'center',
  },
  icon__container: {
    marginHorizontal: 3,
  },
  button__icon: {
    // padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
})

export default {
  Full: Button,
  Icon: IconButton,
}
