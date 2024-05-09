import React, { memo } from 'react'
import { StyleSheet, View, StyleProp, TextStyle } from 'react-native'
import { H1, H2, H3 } from '@components/Typography'

type IProps = {
  level: number
  children: any
  style?: StyleProp<TextStyle>
}

function SectionHeading(props: IProps) {
  function renderLevel(level) {
    if (level === 2)
      return (
        <H3 align="center" bold style={props.style}>
          {props.children}
        </H3>
      )

    if (level === 0)
      return (
        <H1 align="center" bold style={props.style}>
          {props.children}
        </H1>
      )

    return (
      <H2 align="center" bold style={props.style}>
        {props.children}
      </H2>
    )
  }

  return <View style={s.container}>{renderLevel(props.level)}</View>
}

SectionHeading.defaultProps = {
  level: 1,
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 40,
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
})

export default memo<IProps>(SectionHeading)
