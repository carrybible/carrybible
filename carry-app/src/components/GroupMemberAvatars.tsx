import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'

import useTheme from '@hooks/useTheme'
import { RootState } from '@dts/state'

import Avatar from '@components/Avatar'
import { Title } from '@components/Typography'

type Props = {
  userIds?: string[]
  avatarSize: number
  avatarBorderSize: number
  fontSize: number
  style?: ViewStyle
}

const MAX_AVATAR_SHOW = 5
const AVATAR_OFFSET_RATIO = 0.4

const GroupMemberAvatars: React.FC<Props> = ({ userIds, avatarSize, style, avatarBorderSize, fontSize }) => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  if (!group.channel?.state.members || !group.channelMembers) {
    return null
  }

  const channelMembers = userIds
    ? userIds.map(uid => group.channel.state.members[uid]).filter(userInfo => !!userInfo)
    : group.channelMembers

  const avatarOffset = AVATAR_OFFSET_RATIO * avatarSize

  return (
    <View
      style={[
        styles.groupAvatarWrapper,
        style,
        {
          transform: [
            {
              translateX: (Math.min(channelMembers.length - 1, MAX_AVATAR_SHOW) / 2) * avatarOffset,
            },
          ],
        },
      ]}
    >
      {channelMembers.slice(0, MAX_AVATAR_SHOW).map((member, index) => {
        const url = member?.user?.image as string
        if (!url) {
          return null
        }
        return (
          <Avatar
            key={index}
            size={avatarSize}
            touchable={false}
            url={url}
            style={
              index > 0
                ? {
                    transform: [
                      {
                        translateX: -avatarOffset * index,
                      },
                    ],
                  }
                : undefined
            }
            borderWidth={avatarBorderSize}
            borderColor={color.background}
          />
        )
      })}
      {channelMembers.length > MAX_AVATAR_SHOW ? (
        <Title
          style={{
            transform: [
              {
                translateX: (MAX_AVATAR_SHOW - 1) * -avatarOffset + 3,
              },
            ],
            fontSize,
          }}
        >
          +{channelMembers.length - MAX_AVATAR_SHOW}
        </Title>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  groupAvatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default GroupMemberAvatars
