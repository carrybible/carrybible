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
}

const TaskTitle: React.FC<Props> = props => {
  const { color } = useTheme()

  return (
    <View style={[s.container, props.style]}>
      <Icon source={props.icon} color={color.contrast} size={20} />
      <Text style={{ marginLeft: 8, flex: 1, fontWeight: '500' }}>{props.title}</Text>
      {props.subtitle ? (
        <Text color={props.subtitleHighlighted ? 'accent' : 'gray5'}>{props.subtitle}</Text>
      ) : (
        props.RightComponent && props.RightComponent()
      )}
    </View>
  )
}

TaskTitle.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
})

export default TaskTitle
