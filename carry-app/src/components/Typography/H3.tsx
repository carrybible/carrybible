/**
 * H3 Component
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
}

const H3: React.FC<Props> = props => {
  const { color, typography } = useTheme()

  return (
    <RNText
      style={[
        {
          color: props.color ? color[props.color] : color.text,
          textAlign: props.align,
          fontSize: typography.h3,
          lineHeight: typography.h3 * 1.4,
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        props.style,
      ]}
      textBreakStrategy="simple"
      numberOfLines={props.numberOfLines}>
      {props.children}
    </RNText>
  )
}

H3.defaultProps = {
  align: 'left',
  bold: true,
}

export default H3
