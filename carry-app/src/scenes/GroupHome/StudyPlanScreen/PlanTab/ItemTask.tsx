import Icon from '@components/Icon'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  style?: StyleProp<ViewStyle>
  icon?: string
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
      {props.icon && <Icon source={props.icon} color={props.color || color.contrast} size={20} />}
      <Text numberOfLines={2} style={[s.itemTaskText, props.color ? { color: props.color } : {}]}>
        {props.title}
      </Text>
      <Icon source="check" color={props.done ? color.accent : color.gray2} size={14} style={s.itemTaskIcon} />
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
  itemTaskText: {
    marginLeft: 8,
    flex: 1,
    marginRight: 8,
  },
  itemTaskIcon: {
    marginRight: 6,
  },
})

export default ItemTask
