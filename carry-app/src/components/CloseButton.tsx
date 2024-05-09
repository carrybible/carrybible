import useTheme from '@hooks/useTheme'
import React from 'react'
import { Image, ImageStyle, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'

const CloseButton: React.FC<{
  style?: ViewStyle
  onPress?: () => void
  source?: NodeRequire
  color?: string
  iconStyle?: ImageStyle
}> = props => {
  const { color } = useTheme()
  return (
    <TouchableOpacity
      style={[
        s.close,
        {
          ...props.style,
        },
      ]}
      onPress={props.onPress}
    >
      <Image
        source={props.source ? props.source : require('@assets/icons/ic-close.png')}
        style={[s.image, { tintColor: props.color || color.black, ...props.iconStyle }]}
      />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  close: {
    position: 'absolute',
    top: 5,
    right: 15,
    backgroundColor: '#EDEEF3',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  image: { width: 12, height: 12 },
})

export default CloseButton
