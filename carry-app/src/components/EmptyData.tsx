/**
 * Chat Empty
 *
 * @format
 * @flow
 */

import Button from '@components/Button'
import { Subheading, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { Image, ImageStyle, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native'

type IProps = {
  text?: string
  subText?: string
  buttonText?: string
  image?: any
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  iconContainerStyle?: StyleProp<ViewStyle>
  imgStyle?: StyleProp<ImageStyle>
  textStyle?: StyleProp<TextStyle>
  subtextStyle?: StyleProp<TextStyle>
  type?: 'image' | 'textIcon'
}

const EmptyData = (props: IProps) => {
  const { color, typography } = useTheme()
  const { type = 'image' } = props
  if (type === 'image')
    return (
      <View style={[s.container, props.style]}>
        <Image source={props.image || null} style={[s.img, props.imgStyle]} resizeMode="contain" />
        {props.buttonText && props.onPress ? (
          <Button.Full
            text={props.buttonText}
            style={[{ backgroundColor: color.accent }, s.button]}
            textStyle={[{ fontSize: typography.body, color: color.white }, s.fontWeight]}
            onPress={props.onPress}
          />
        ) : null}
        <Text bold align="center" style={props.textStyle}>
          {props.text}
        </Text>
        {props.subText && (
          <Subheading align="center" style={[s.opacity08, props.subtextStyle]}>
            {props.subText}
          </Subheading>
        )}
      </View>
    )
  if (type === 'textIcon')
    return (
      <View style={[s.container, props.style]}>
        <View style={[s.iconContainer, props.iconContainerStyle]}>
          <Text style={s.textIcon}>{props.image}</Text>
        </View>
        <View>
          <Text bold align="center" style={[s.textTitle, props.textStyle]}>
            {props.text}
          </Text>
          {props.subText ? (
            <Subheading align="center" style={[s.subText, props.textStyle]}>
              {props.subText}
            </Subheading>
          ) : null}
        </View>
      </View>
    )
  return <View />
}

EmptyData.defaultProps = {
  style: {},
}

const s = StyleSheet.create({
  opacity08: { opacity: 0.8 },
  button: { borderRadius: 7, height: 50 },
  fontWeight: { fontWeight: '700' },
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: 0,
    flexGrow: 1,
    marginTop: '60%',
    paddingHorizontal: 20,
  },
  img: {
    height: 200,
    flexGrow: 1,
    marginBottom: 25,
  },
  textIcon: {
    fontSize: 50,
  },
  iconContainer: {
    width: 135,
    height: 135,
    borderRadius: 67.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textTitle: {
    marginTop: 10,
  },
  subText: {
    opacity: 0.8,
    marginTop: 10,
    marginHorizontal: 65,
  },
})

export default EmptyData
