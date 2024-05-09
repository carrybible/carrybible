import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import { Footnote, H3, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { BibleFormatter, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'

type IProps = {
  name: string
  readingPosition?: string
  onlineTime: string
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
  score?: number
}

const MemberItem = (props: IProps) => {
  const { color } = useTheme()

  const OnlineStatus = () => {
    if (!props.isOnline) {
      return null
    }
    return (
      <View
        style={[
          // eslint-disable-next-line react-native/no-inline-styles
          {
            backgroundColor: '#80D159',
            width: props.size * 0.36,
            height: props.size * 0.36,
            borderRadius: props.size * 0.2,
          },
          s.badge,
          { borderColor: color.background },
        ]}
      />
    )
  }

  const singleAvatarStyle = {
    borderColor: color.background,
    width: props.size - 4,
    height: props.size - 4,
    borderRadius: (props.size - 4) * 0.5,
  }

  const scoreColor = useMemo(() => {
    if (!props.score) {
      return ''
    }
    if (props.score >= 50) {
      return '#6FCF97'
    }
    if (props.score >= 26) {
      return '#F2C94C'
    }
    return '#EB5757'
  }, [props.score])

  if (props.type === 'mini') {
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
          <Footnote color="gray">{props.onlineTime}</Footnote>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity style={s.container} onPress={props.onPress} disabled={!(!props.isCurrentUser && props.onPress)}>
      <View style={s.avatar}>
        <Avatar url={props.image} size={props.size - 4} touchable={false} />
        <OnlineStatus />
      </View>
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <View style={[s.name, { maxWidth: props.score ? '60%' : '65%' }]}>
        <View style={s.nameWrapper}>
          <H3 style={s.nameText} numberOfLines={props.isOwner ? 1 : 2}>
            {props.isCurrentUser ? I18n.t('text.You') : props.name || I18n.t('text.Anonymous')}
          </H3>
        </View>
        <View style={s.readingWrapper}>
          {props.isOwner ? (
            <Footnote color="gray2" style={s.footnoteReadingPosition}>
              {I18n.t('text.Leader')}
            </Footnote>
          ) : null}
          {props.readingPosition ? (
            <Footnote color="gray2" style={s.footnoteReadingPosition}>
              {props.readingPosition ? `in ${BibleFormatter.toOsis(props.readingPosition, 'full')}` : '-'}
            </Footnote>
          ) : null}
        </View>
      </View>

      {props.score ? <Icon source={require('@assets/icons/activity_indicator.png')} size={25} color={scoreColor} /> : null}

      <View style={s.flex1} />

      <View style={s.row}>
        <Icon source={require('@assets/icons/ic_streak.png')} size={20} color={props.currentStreak ? color.orange : '#B6CAFF'} />
        <Text style={[s.streak, { color: color.black2 }]}>{props.currentStreak || 0}</Text>
      </View>
    </TouchableOpacity>
  )
}

MemberItem.defaultProps = {
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
  streak: {
    fontWeight: 'bold',
    minWidth: 25,
    textAlign: 'left',
    marginLeft: 5,
  },
  nameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameText: {
    marginRight: 5,
  },
  readingWrapper: {
    flexDirection: 'row',
  },
  footnoteReadingPosition: { opacity: 0.7 },
  flex1: {
    flex: 1,
  },
})

export default React.memo(
  MemberItem,
  (p, n) =>
    p.name === n.name &&
    p.lastActive === n.lastActive &&
    p.readingPosition === n.readingPosition &&
    p.isOnline === n.isOnline &&
    p.currentStreak === n.currentStreak,
)
