/**
 * Thick Button
 *
 * @format
 *
 */

import React from 'react'
import { StyleSheet, View, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native'
import { H1, Subheading, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'

interface Props {
  bigTitle?: string
  title?: string
  description?: string
  height: number
  onPress?: any
}

const ThickButton: React.FC<Props> = props => {
  const { color } = useTheme()
  return (
    <TouchableOpacity onPress={props.onPress}>
      <View style={[{ backgroundColor: color.lavender }, s.fakeShadow]} />
      <View
        style={[
          s.btn,
          {
            backgroundColor: color.accent,
            borderColor: color.white,
            height: props.height || 62,
          },
        ]}
      >
        {props.bigTitle ? <H1 color="white">{props.bigTitle}</H1> : null}
        {props.title ? (
          <Text color="white" bold style={{ fontWeight: '700' }}>
            {props.title}
          </Text>
        ) : null}
        {props.description ? (
          <Subheading color="white" align="center">
            {props.description}
          </Subheading>
        ) : null}
      </View>
      {props.children}
    </TouchableOpacity>
  )
}

ThickButton.defaultProps = {}

const s = StyleSheet.create({
  btn: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 4,
    marginBottom: 8,
  },
  fakeShadow: { position: 'absolute', bottom: 0, right: 0, left: 0, height: 30, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
})

export default ThickButton
