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

const H1: React.FC<Props> = props => {
  const { color, typography } = useTheme()

  return (
    <RNText
      style={[
        {
          color: props.color ? color[props.color] : color.text,
          textAlign: props.align,
          fontSize: typography.title,
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        props.style,
      ]}
      textBreakStrategy="simple">
      {props.children}
    </RNText>
  )
}

H1.defaultProps = {
  align: 'left',
  bold: true,
}

export default H1
