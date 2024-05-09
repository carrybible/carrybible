import { Text } from '@components/Typography'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const LoadingIndicator: React.FC<any> = props => {
  return (
    <View style={s.contentWrapper}>
      <LottieView source={require('@assets/animations/info.json')} style={s.lottie} autoPlay loop />
      <Text style={s.loadingText}>{I18n.t('Loading')}</Text>
      <View style={s.height} />
    </View>
  )
}

const s = StyleSheet.create({
  lottie: {
    width: 35,
    height: 35,
    marginBottom: 10,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { opacity: 0.7 },
  height: { height: 40 },
})

export default LoadingIndicator
