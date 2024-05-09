import React, { forwardRef } from 'react'
import { Platform, Text as RNText, StyleProp, TextStyle } from 'react-native'
import { Color } from 'src/dts'
import useTheme from 'src/hooks/useTheme'

interface Props {
  style?: StyleProp<TextStyle>
  align?: 'center' | 'left' | 'right'
  children?: any
  onTextLayout?: any
  onPress?: () => void
  bold?: boolean
  numberOfLines?: number
  suppressHighlighting?: boolean
  selectable?: boolean
  color?: keyof Color
}

const Text: React.ForwardRefRenderFunction<RNText, Props> = (props, ref) => {
  const { color } = useTheme()

  const textColor = () => {
    if (props.color) return color[props.color]
    return color.text
  }

  return (
    <RNText
      ref={ref}
      onPress={props.onPress}
      style={[
        {
          color: textColor(),
          textAlign: props.align || 'left',
          // fontSize: typography.body,
          ...Platform.select({
            android: { fontFamily: 'Roboto' },
            ios: { fontWeight: props.bold ? '700' : '400' },
          }),
        },
        props.style,
      ]}
      // textBreakStrategy="simple"
      numberOfLines={props.numberOfLines}
      suppressHighlighting={props.suppressHighlighting}
      selectable={props.selectable}
      onTextLayout={props.onTextLayout}>
      {props.children}
    </RNText>
  )
}

export default forwardRef<RNText, Props>(Text)
