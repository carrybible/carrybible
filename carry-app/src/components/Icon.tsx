/**
 * Icon Component
 *
 * @format
 *
 */

import React from 'react'
import FeatherIcon from 'react-native-vector-icons/Feather'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { Image, ImageStyle, StyleProp } from 'react-native'
import useTheme from '@hooks/useTheme'
import { Color } from '@dts/index'

interface IProps {
  source: any
  size?: number
  color?: string | keyof Color
  style?: StyleProp<ImageStyle>
  font?: string
}

const Icon: React.FC<IProps> = props => {
  const { color } = useTheme()

  const iconColor = () => {
    if (!props.color) return undefined
    if (props.color?.includes('#')) return props.color
    return color[props.color || 'secondary']
  }

  if (typeof props.source === 'string') {
    if (!props.font) return <FeatherIcon name={props.source || 'check'} size={props.size || 20} color={iconColor()} style={props.style} />
    if (props.font === 'entypo')
      return <EntypoIcon name={props.source || 'check'} size={props.size || 20} color={iconColor()} style={props.style} />
  }
  return (
    <Image
      source={props.source}
      style={[
        {
          width: props.size,
          height: props.size,
          tintColor: iconColor(),
        },
        props.style,
      ]}
      //@ts-ignore
      tintColor={iconColor()}
      resizeMode={'contain'}
    />
  )
}

Icon.defaultProps = {
  size: 20,
}

export default Icon
