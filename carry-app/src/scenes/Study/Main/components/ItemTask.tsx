/**
 * Task Title
 *
 * @format
 *
 */

import React from 'react'
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native'
import Icon from '@components/Icon'
import useTheme from '@hooks/useTheme'
import { Text } from '@components/Typography'

interface Props {
  style?: StyleProp<ViewStyle>
  icon: string
  title: string
  subtitle?: string
  subtitleHighlighted?: boolean
  RightComponent?: any
  color?: string
  done?: boolean
}

const ItemTask: React.FC<Props> = props => {
  const { color } = useTheme()

  return (
    <View style={[s.container, props.style]}>
      <Icon source={props.icon} color={props.color || color.contrast} size={20} />
      <Text numberOfLines={2} style={[{ marginLeft: 8, flex: 1, marginRight: 8 }, props.color ? { color: props.color } : {}]}>
        {props.title}
      </Text>
      <Icon source="check" color={props.done ? color.accent : color.gray2} size={14} style={{ marginRight: 6 }} />
    </View>
  )
}

ItemTask.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
})

export default ItemTask
