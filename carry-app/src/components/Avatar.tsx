/* eslint-disable react-native/no-inline-styles */
// TODO: Fix ts
import useFirestoreDoc from '@hooks/useFirestoreDoc'
import _ from 'lodash'
import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Loading from './Loading'

export const MODES = {
  view: 'view',
  edit: 'edit',
  stats: 'stats',
  remote: 'remote',
}

type IProps = {
  url?: string
  source?: any
  size: number
  round: boolean
  style?: any
  onPress?: () => void
  disabled?: boolean
  pressable?: boolean // If false, can not press but still show as active
  loading?: boolean
  name?: string
  touchable?: boolean
  id?: string
  borderWidth?: number
  borderColor?: string
}

function isRemoteURL(url) {
  if (typeof url === 'string') return url && url.includes('http')
  return _.get(url, 'uri') && url.uri.includes('http')
}

const Avatar = (props: IProps) => {
  const [profile] = useFirestoreDoc('users', props.id, [])
  function renderImage() {
    if (props.id || isRemoteURL(props.url || props.source)) {
      const uriDraw = profile?.image || props.url || ''
      const facebookSettings = (() => {
        if (uriDraw.includes('graph.facebook.com')) {
          if (uriDraw.includes('?')) {
            return '&width=400&height=400'
          }
          return '?width=400&height=400'
        }
        return ''
      })()
      const uri = `${uriDraw}${facebookSettings}`
      const source = props.source || { uri }

      return (
        <FastImage
          source={source}
          resizeMode={FastImage.resizeMode.cover}
          style={{
            height: props.size,
            width: props.size,
            borderRadius: props.round ? props.size * 0.5 : 0,
            opacity: props.loading ? 0.5 : 1,
            backgroundColor: '#00000023',
            borderWidth: props.borderWidth,
            borderColor: props.borderColor,
          }}
        />
      )
    }

    const localURI = props.source || { uri: props.url || '' }
    if (_.get(localURI, 'uri'))
      return (
        <Image
          source={props.source || { uri: props.url || '' }}
          resizeMode={FastImage.resizeMode.cover}
          style={{
            height: props.size,
            width: props.size,
            borderRadius: props.round ? props.size * 0.5 : 0,
            opacity: props.loading ? 0.5 : 1,
            backgroundColor: '#00000023',
          }}
        />
      )

    return (
      <View
        style={{
          height: props.size,
          width: props.size,
          borderRadius: props.round ? props.size * 0.5 : 0,
          opacity: props.loading ? 0.5 : 1,
          backgroundColor: '#00000030',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image
          source={require('@assets/images/img-avatar-1.png')}
          resizeMode={FastImage.resizeMode.cover}
          style={{
            height: props.size,
            width: props.size,
            borderRadius: props.round ? props.size * 0.5 : 0,
            opacity: props.loading ? 0.5 : 1,
            backgroundColor: '#00000023',
          }}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={!props.touchable || props.disabled || props.loading || !props.pressable}
      style={[s.container, { opacity: props.disabled ? 0.3 : 1 }, props.style]}>
      {renderImage()}
      {props.loading && <Loading style={s.loading} spinnerSize={20} centered />}
    </TouchableOpacity>
  )
}

Avatar.defaultProps = {
  round: true,
  disabled: false,
  pressable: true,
  size: 100,
  touchable: true,
}

const s = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
})

export default Avatar
