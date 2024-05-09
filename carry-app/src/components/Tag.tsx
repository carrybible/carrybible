/**
 * Tag
 *
 * @format
 *
 */

import Color from '@dts/color'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Icon from './Icon'
import { Footnote } from './Typography'

export interface TagProps {
  hidden?: boolean
  style?: StyleProp<ViewStyle>
  icon?: 'fire' | 'book' | 'users' | 'map-pin' | 'trending-down' | 'trending-up'
  text: string
  children?: any // handle case custom text
  color: keyof Color
  fontWeight?: '400' | '500' | '600' | '700'
  backgroundColor?: string
}

const Tag: React.FC<TagProps> = props => {
  const { color } = useTheme()

  const textColor = () => {
    return color[props.color] || props.color
  }

  const icon = () => {
    switch (props.icon) {
      case 'fire':
        return require('@assets/icons/ic-fire.png')
      case 'book':
        return 'book-open'
      case 'trending-down':
        return 'trending-down'
      case 'trending-up':
        return 'trending-up'
      case 'users':
        return 'users'
      case 'map-pin':
        return 'map-pin'
    }
  }

  if (props.hidden) return null

  return (
    <View
      style={[
        {
          backgroundColor: props.backgroundColor || `${textColor()}20`,
          paddingHorizontal: 8,
          alignSelf: 'flex-start',
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}
    >
      {props.icon ? <Icon source={icon()} size={props.icon === 'fire' ? 13 : 14} color={textColor()} /> : null}
      <Footnote
        style={[
          {
            color: textColor(),
            fontWeight: props.fontWeight || Platform.OS === 'ios' ? '600' : 'bold',
            fontSize: 12,
            lineHeight: 22,
            marginLeft: props.icon === 'fire' ? 2 : 4,
            maxWidth: 180,
          },
          !props.icon ? { marginLeft: 0 } : {},
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {props.children ? props.children : props.text}
      </Footnote>
    </View>
  )
}

Tag.defaultProps = {}

const s = StyleSheet.create({})

export default Tag
