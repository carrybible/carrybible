import GroupAvatar from '@components/GroupAvatar'
import Icon from '@components/Icon'
import { H2, Subheading } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Metrics from '@shared/Metrics'
import Styles from '@shared/Styles'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Channel } from 'stream-chat'
import useChannelPreview from './hooks/useChannelPreview'
import useChannelPreviewStatus from './hooks/useChannelPreviewStatus'
import { formatToDistance } from '@shared/Utils'

interface Props {
  channel: Channel
  latestMessagePreview: any
  unread: number
}

const DirectMessageItem: React.FC<Props> = props => {
  const { latestMessagePreview, channel, unread } = props
  const { color } = useTheme()
  const { name, image, creator, type, members } = useChannelPreview(channel)
  const { muted } = useChannelPreviewStatus(channel)

  const distance = formatToDistance(props.latestMessagePreview?.created_at)

  return (
    <TouchableOpacity
      style={[s.container, { backgroundColor: color.middle }]}
      onPress={() => {
        NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { id: channel.id })
      }}>
      <View style={s.avatarContainer}>
        <GroupAvatar
          type={type}
          image={image}
          members={members}
          creator={creator}
          size={60}
          hideStatus={type === 'direct' ? false : true}
        />
      </View>
      <View style={s.nameContainer}>
        <H2
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            fontWeight: unread > 0 ? '700' : '500',
          }}
          numberOfLines={1}>
          {name}
        </H2>
        <Subheading numberOfLines={2}>
          {latestMessagePreview.previews.map((preview, index) =>
            preview.text ? (
              <Subheading
                style={[unread ? s.unread : s.read, { color: unread > 0 ? color.text : color.gray3 }]}
                bold={preview.bold}
                key={`${preview.text}_${index}`}
                numberOfLines={1}>
                {preview.text}
              </Subheading>
            ) : null,
          )}
        </Subheading>
      </View>
      <View style={s.status__container}>
        <Subheading style={[s.distanceTimeText, { color: color.gray3 }]}>{distance}</Subheading>
        {muted && <Icon style={s.muteIcon} source={require('../../assets/icons/ic-mute.png')} size={14} color={color.gray5} />}
        {props.unread > 0 && (
          <View
            style={[
              s.dot,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                backgroundColor: color.accent2,
                marginLeft: muted ? 5 : 0,
              },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Metrics.insets.horizontal,
    marginBottom: 10,
    paddingVertical: 23,
    marginHorizontal: Metrics.insets.horizontal,
    borderRadius: 15,
    ...Styles.shadow2,
  },
  nameContainer: { flex: 1 },
  status__container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  unread: {
    opacity: 1,
  },
  read: {
    opacity: 0.8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    alignSelf: 'flex-end',
    marginTop: 9,
  },
  avatarContainer: {
    marginRight: 12,
  },
  distanceTimeText: {
    fontSize: 12,
    marginTop: 3,
  },
  muteIcon: {
    alignSelf: 'flex-end',
    marginTop: 3,
  },
})

export default DirectMessageItem
