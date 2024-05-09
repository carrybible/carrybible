/**
 * MemberItem View
 *
 * @format
 *
 */

import React from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import Icon from '@components/Icon'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Styles, Metrics } from '@shared/index'
import Avatar from '@components/Avatar'

interface Props {
  name: string
  image: string
  dayStreak: number
  isUser?: boolean
  onPress?: () => void
}

const MemberItem: React.FC<Props> = props => {
  const { color } = useTheme()

  return (
    <TouchableOpacity
      style={[
        s.itemContainer,
        { backgroundColor: color.background, shadowColor: color.text },
        props.isUser
          ? {
              borderWidth: 2,
              borderColor: color.accent,
            }
          : {},
      ]}
      onPress={props.onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar url={props.image} size={44} name={props.name} />
        <Text bold style={{ marginLeft: 10, maxWidth: '80%' }}>
          {props.name || 'Anonymous'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Icon source={require('@assets/icons/ic_streak.png')} size={20} color={props.dayStreak ? color.orange : '#B6CAFF'} />
        <Text style={[s.streak, { color: color.black2 }]}>{props.dayStreak || 0}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  itemContainer: {
    height: 66,
    flexDirection: 'row',
    borderRadius: 10,
    ...Styles.shadow,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: Metrics.insets.vertical,
    marginBottom: 14,
  },
  streak: {
    fontWeight: 'bold',
    minWidth: 25,
    textAlign: 'left',
    marginLeft: 5,
  },
})

export default React.memo(MemberItem, (p, n) => p.name === n.name && p.dayStreak === n.dayStreak)
