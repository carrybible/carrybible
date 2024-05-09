import I18n from 'i18n-js'
import React from 'react'
import LottieView from 'lottie-react-native'
import { StyleSheet, View } from 'react-native'
import { Text } from '@components/Typography'
import Button from '@components/Button'
import { useSelector } from 'react-redux'
import { StreamIO } from '@shared/index'

const LoadingErrorIndicator: React.FC<any> = props => {
  const user = useSelector<any, App.User>(state => state.me)
  return (
    <View style={s.wrapper}>
      <LottieView source={require('@assets/animations/error.json')} style={s.lottie} autoPlay loop />
      <Text style={s.loadingText}>{I18n.t('Error loading')}</Text>
      {props.listType === 'channel' && props.retry && (
        <Button.Full
          text="Reload"
          textStyle={s.retryText}
          onPress={() => {
            if (!StreamIO.client.user) {
              StreamIO.login(user).then(() => {
                props.retry && props.retry()
              })
            } else {
              props.retry && props.retry()
            }
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  lottie: {
    width: 35,
    height: 35,
    marginBottom: 10,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    opacity: 0.7,
  },
  retryText: {
    fontWeight: '700',
  },
})

export default LoadingErrorIndicator
