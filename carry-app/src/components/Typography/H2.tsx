/**
 * H2 Component
 *
 * @format
 *
 */

import React from 'react'
import { Platform, Text as RNText, StyleProp, TextStyle } from 'react-native'
import { Color } from 'src/dts'
import useTheme from 'src/hooks/useTheme'

interface Props {
  align?: 'center' | 'left' | 'right'
  bold?: boolean
  children?: any
  color?: keyof Color
  numberOfLines?: number
  style?: StyleProp<TextStyle>
  onPress?: () => void
  otherProps?: any
}

const H2: React.FC<Props> = props => {
  const { color, typography } = useTheme()

  return (
    <RNText
      onPress={props.onPress}
      style={[
        {
          color: props.color ? color[props.color] : color.text,
          textAlign: props.align,
          fontSize: typography.h2,

          lineHeight: typography.h2 * 1.4,
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        props.style,
      ]}
      numberOfLines={props.numberOfLines}
      textBreakStrategy="simple"
      {...props.otherProps}>
      {props.children}
    </RNText>
  )
}

H2.defaultProps = {
  align: 'left',
  bold: true,
}

export default H2
