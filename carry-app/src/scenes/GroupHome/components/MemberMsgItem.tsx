/**
 * Group Member Item Component
 *
 * @format
 *
 */

import React from 'react'
import _ from 'lodash'
import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'
import useTheme from '@hooks/useTheme'
import { Metrics, BibleFormatter } from '@shared/index'
import { H3, Footnote, Text } from '@components/Typography'
import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import Tag from '@components/Tag'

type IProps = {
  name: string
  readingPosition?: string
  image?: string
  isCurrentUser?: boolean
  isOnline?: boolean
  currentStreak?: number
  lastActive?: string
  isOwner?: boolean
  style?: ViewStyle
  size: number
  onPress?: () => void
  type?: 'normal' | 'mini'
}

const shortenTime = (s: string) => {
  const number = s.split(' ')[0]
  const time = s.split(' ')[1].substr(0, 1)
  return `${number}${time}`
}

const MemberMsgItem = (props: IProps) => {
  const { color } = useTheme()

  const OnlineStatus = () => {
    if (!props.isOnline) {
      return null
    }
    return (
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          backgroundColor: '#80D159',
          ...s.badge,
          borderColor: color.background,
          width: props.size * 0.36,
          height: props.size * 0.36,
          borderRadius: props.size * 0.2,
        }}
      />
    )
  }

  const singleAvatarStyle = {
    borderColor: color.background,
    width: props.size - 4,
    height: props.size - 4,
    borderRadius: (props.size - 4) * 0.5,
  }

  if (props.type == 'mini') {
    return (
      <TouchableOpacity onPress={props.onPress} disabled={props.onPress ? false : true}>
        <View style={s.containerMini}>
          <View style={s.avatar}>
            <FastImage
              style={{
                ...s.picture,
                ...singleAvatarStyle,
              }}
              source={{ uri: props.image || '' }}
              resizeMode="cover"
            />
            <OnlineStatus />
          </View>
          <H3>{props.name}</H3>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={s.container}
      onPress={props.onPress}
      disabled={!props.isCurrentUser && props.onPress ? false : true}
      activeOpacity={1}
    >
      <View style={s.avatar}>
        <Avatar url={props.image} size={props.size - 4} onPress={props.onPress} />
        <OnlineStatus />
      </View>
      <View style={s.name}>
        <View style={s.ownerWrapper}>
          <H3 style={s.ownerNameText}>{props.isCurrentUser ? 'You' : props.name || 'Anonymous'}</H3>
          {props.isOwner && <Icon source={require('@assets/icons/icons8-key.png')} size={16} color={color.orange} />}
        </View>
      </View>
      <View style={s.row}>
        <Icon source={'chevron-thin-right'} font={'entypo'} size={18} color={color.text} />
      </View>
    </TouchableOpacity>
  )
}

MemberMsgItem.defaultProps = {
  size: 56,
  type: 'normal',
}

const s = StyleSheet.create({
  container: {
    paddingVertical: Metrics.insets.vertical,
    paddingHorizontal: Metrics.insets.horizontal,
    alignItems: 'center',
    flexDirection: 'row',
    height: 70,
    marginBottom: 5,
  },
  containerMini: {
    flex: 1,
    marginTop: 10,
    paddingVertical: Metrics.insets.vertical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    paddingRight: Metrics.insets.horizontal,
    marginLeft: 12,
  },
  picture: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  badge: {
    height: 14,
    width: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: -5,
    bottom: -5,
    borderWidth: 2,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  ownerNameText: { marginRight: 5 },
})

export default React.memo(
  MemberMsgItem,
  (p, n) =>
    p.name === n.name &&
    p.lastActive === n.lastActive &&
    p.readingPosition === n.readingPosition &&
    p.isOnline === n.isOnline &&
    p.currentStreak === n.currentStreak,
)
