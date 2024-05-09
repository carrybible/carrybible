/**
 * ChannelPreview
 *
 * @format
 *
 */

import GroupAvatar from '@components/GroupAvatar'
import Icon from '@components/Icon'
import { H2, Subheading } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { Channel } from 'stream-chat'
import useChannelPreview from './hooks/useChannelPreview'
import useChannelPreviewStatus from './hooks/useChannelPreviewStatus'

interface Props {
  channel: Channel
  latestMessagePreview: any
  unread: number
}

const ChannelPreview: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const { latestMessagePreview, channel, unread } = props
  const { color } = useTheme()
  const { name, image, creator, type, members } = useChannelPreview(channel)
  const { muted } = useChannelPreviewStatus(channel)

  if (channel.id?.includes('!members') || channel.id?.includes('private')) return null

  return (
    <TouchableOpacity
      style={s.container}
      onPress={() => {
        if (channel) {
          dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: channel.id })
          NavigationRoot.home()
          setTimeout(() => {
            toast.success(I18n.t('text.Changed to group', { nameValue: channel.data?.name ?? '' }))
          }, 250)
        }
      }}>
      <View style={s.avatarWrapper}>
        <GroupAvatar type={type} image={image} members={members} creator={creator} size={60} hideStatus={type !== 'direct'} />
      </View>
      <View style={s.flex1}>
        <H2
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontWeight: unread > 0 ? '700' : '500',
          }}
          numberOfLines={1}>
          {name}
        </H2>
        <Subheading numberOfLines={1}>
          {latestMessagePreview.previews.map((preview, index) =>
            preview.text ? (
              <Subheading
                style={[unread ? s.unread : s.read, { color: unread > 0 ? color.text : color.gray3 }]}
                bold={preview.bold}
                key={`${preview.text}_${index}`}>
                {preview.text}
              </Subheading>
            ) : null,
          )}
        </Subheading>
      </View>
      <View style={s.status__container}>
        {muted && <Icon source={require('../../assets/icons/ic-mute.png')} size={14} color={color.gray5} />}
        {props.unread > 0 && (
          <View
            style={[
              s.unreadDot,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                backgroundColor: color.notification,
                borderColor: color.background,
                marginLeft: muted ? 5 : 0,
              },
            ]}
          />
        )}
        {props.latestMessagePreview?.status > 0 && (
          <Icon
            size={14}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{ marginLeft: muted ? 5 : 0 }}
            source={require('../../assets/icons/ic-read.png')}
            color={props.latestMessagePreview?.status === 1 ? color.gray5 : color.notification}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: Metrics.insets.horizontal,
    marginBottom: 10,
  },
  status__container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  unread: {
    opacity: 1,
  },
  read: {
    opacity: 0.8,
  },
  flex1: { flex: 1 },
  unreadDot: {
    height: 14,
    width: 14,
    borderRadius: 7,
  },
  avatarWrapper: {
    marginRight: 12,
  },
})

export default ChannelPreview
