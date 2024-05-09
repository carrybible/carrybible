import Icon from '@components/Icon'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

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
      <Text style={s.titleText}>{props.title}</Text>
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
  titleText: { marginLeft: 8, flex: 1, fontWeight: '500' },
})

export default TaskTitle
