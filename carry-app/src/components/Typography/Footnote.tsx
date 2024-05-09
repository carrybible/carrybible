/**
 * Footnote Component
 *
 * @format
 * @flow
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
  ellipsizeMode?: 'middle' | 'head' | 'tail' | 'clip'
  onPress?: () => void
}

const Footnote: React.FC<Props> = props => {
  const { color, typography } = useTheme()

  const textColor = () => {
    if (props.color) return color[props.color]
    return color.text
  }

  return (
    <RNText
      numberOfLines={props.numberOfLines}
      style={[
        {
          color: textColor(),
          textAlign: props.align,

          fontSize: typography.footnote,
          lineHeight: typography.footnote * 1.4,
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        props.style,
      ]}
      onPress={props.onPress}
      textBreakStrategy="simple"
      ellipsizeMode={props.ellipsizeMode}>
      {props.children}
    </RNText>
  )
}

Footnote.defaultProps = {
  align: 'left',
}

export default Footnote
