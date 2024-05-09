/**
 * Task
 *
 * @format
 *
 */

import React from 'react'
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native'
import { Text } from '@components/Typography'
import Icon from '@components/Icon'
import useTheme from '@hooks/useTheme'

interface Props {
  style?: StyleProp<ViewStyle>
  taskName: string
  done?: boolean
}

const Task: React.FC<Props> = props => {
  const { color } = useTheme()

  return (
    <View style={[s.container, props.style]}>
      <Text style={{ flex: 1 }}>{props.taskName}</Text>
      <Icon source="check" color={props.done ? color.accent : color.gray2} size={14} style={{ marginRight: 6 }} />
    </View>
  )
}

Task.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
})

export default Task
