/**
 * Group Avatar Component
 *
 * @format
 *
 */

import React from 'react'
import _ from 'lodash'
import { StyleSheet, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import auth from '@react-native-firebase/auth'
import { Group } from '@dts/index'
import useTheme from '@hooks/useTheme'

// type User = {
//   id: string
//   photoURL?: string
//   image?: string
//   online: boolean
// }

type IProps = {
  type: Group['communicationType']
  image?: string
  creator?: any
  members?: Array<any>
  size: number
  style?: ViewStyle
  hideStatus?: boolean
}

const GroupAvatar = (props: IProps) => {
  const { color } = useTheme()
  const uid: string = auth().currentUser?.uid || ''

  const OnlineStatus = () => {
    if (props.hideStatus) return null
    const onlineMembers = props.members
      ? _.filter(Object.values(props.members), {
          online: true,
        })
      : undefined
    if (onlineMembers && onlineMembers.length > 1) {
      return (
        <View
          style={[
            s.background,
            {
              borderColor: color.background,
              ...s.badge,
              width: props.size * 0.3,
              height: props.size * 0.3,
              borderRadius: props.size * 0.2,
            },
          ]}
        />
      )
    }
    return null
  }

  const singleAvatarStyle = {
    borderColor: color.background,
    borderWidth: 2,
    width: props.size - 4,
    height: props.size - 4,
    borderRadius: (props.size - 4) * 0.5,
  }

  const doubleAvatarStyle = {
    backgroundColor: color.id === 'light' ? '#EBEBEB' : color.middle,
    borderColor: color.background,
    width: props.size * 0.65,
    height: props.size * 0.65,
    borderRadius: props.size * 0.65 * 0.5,
  }

  // If it's personal chat between 2 people
  if (props.type === 'direct') {
    // Show the image of the other person
    const other = _.find(props.members, m => m.id !== uid)
    const uri = other?.image || other?.photoURL
    return (
      <View style={[{ ...s.image__container, width: props.size, height: props.size }, props.style]}>
        <FastImage
          style={{
            ...s.picture,
            ...singleAvatarStyle,
          }}
          source={{ uri: uri || '' }}
          resizeMode="cover"
        />
        <OnlineStatus />
      </View>
    )
  }

  // If the space has custom image set
  if (props.image) {
    return (
      <View style={[{ ...s.image__container, width: props.size, height: props.size }, props.style]}>
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
    )
  }

  // Old data
  if (props.members && props.members.length >= 2) {
    return (
      <View style={{ ...s.image__container, width: props.size, height: props.size }}>
        <FastImage
          style={{
            ...s.small__image,
            ...s.small__image1,
            ...doubleAvatarStyle,
          }}
          source={{ uri: props.members[0].photoURL || props.members[0].image || '' }}
          resizeMode="cover"
        />
        <FastImage
          style={{
            ...s.small__image,
            ...s.small__image2,
            ...doubleAvatarStyle,
          }}
          source={{ uri: props.members[1].photoURL || props.members[1].image || '' }}
          resizeMode="cover"
        />
        <OnlineStatus />
      </View>
    )
  }

  // By default, return the thread creator image
  if (props.creator) {
    return (
      <View style={{ ...s.image__container, width: props.size, height: props.size }}>
        <FastImage
          style={{
            ...s.small__image,
            ...s.small__image1,
            ...doubleAvatarStyle,
          }}
          source={{ uri: '' }}
          resizeMode="cover"
        />
        <FastImage
          style={{
            ...s.small__image,
            ...s.small__image2,
            ...doubleAvatarStyle,
          }}
          source={{ uri: props.creator.image || '' }}
          resizeMode="cover"
        />
        <OnlineStatus />
      </View>
    )
  }

  return null
}

GroupAvatar.defaultProps = {
  size: 40,
  hasCustomImage: false,
}

const s = StyleSheet.create({
  image__container: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picture: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  small__image: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  small__image1: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 0,
    backgroundColor: '#EBEBEB',
  },
  small__image2: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    zIndex: 1,
    backgroundColor: '#EBEBEB',
  },
  badge: {
    height: 14,
    width: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    bottom: 1,
    borderWidth: 2,
  },
  background: { backgroundColor: '#76d673' },
})

export default GroupAvatar
