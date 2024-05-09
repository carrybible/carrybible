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

const Subheading: React.FC<Props> = props => {
  const { color, typography } = useTheme()
  const font: any = {}

  return (
    <RNText
      style={[
        {
          color: props.color ? color[props.color] : color.text,
          textAlign: props.align,
          fontSize: typography.subhead,

          lineHeight: Math.floor(typography.subhead * 1.4),
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        font,
        props.style,
      ]}
      textBreakStrategy="simple"
      numberOfLines={props.numberOfLines ?? 0}>
      {props.children}
    </RNText>
  )
}

Subheading.defaultProps = {
  align: 'left',
}

export default Subheading
