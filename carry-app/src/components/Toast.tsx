import LottieView from 'lottie-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Platform, View } from 'react-native'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import Styles from '@shared/Styles'
import Metrics from '@shared/Metrics'
import Emitter from '@shared/Emitter'
import { isIphoneX } from '@shared/Metrics'

const HEIGHT = 50 //Metrics.header.height + Metrics.status.height
const TRANSLATEY = Metrics.safeArea.bottom + HEIGHT + (Platform.OS === 'android' ? 13 : 5)
const ANIMATIONS = {
  error: { source: require('@assets/animations/error.json'), loop: true },
  success: { source: require('@assets/animations/success-2.json'), loop: false },
  info: { source: require('@assets/animations/info.json'), loop: true },
}

const Toast = () => {
  const [state, setState] = useState({
    message: '',
    type: 'success',
  })
  const lottie = useRef<LottieView>()
  const offset = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const { color: theme } = useTheme()

  useEffect(() => {
    const id = Emitter.on('SHOW_TOAST_MESSAGE', ({ message, type }) => {
      offset.setValue(HEIGHT)
      setState({ message, type })
      lottie.current?.play()

      Animated.sequence([
        Animated.delay(100),
        // Fade In
        Animated.parallel([
          Animated.timing(offset, {
            toValue: -TRANSLATEY,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),

        Animated.delay(2500),
        // Fade Out
        Animated.parallel([
          Animated.timing(offset, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        lottie.current?.reset()
      })
    })

    return () => {
      Emitter.rm(id)
    }
  }, [])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: offset }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={{
          backgroundColor: theme.middle,
          ...styles.message__container,
        }}
      >
        <LottieView ref={lottie} {...ANIMATIONS[state.type]} style={styles.lottie} autoPlay={false} />
        <Text style={styles.message} numberOfLines={2}>
          {state.message}
        </Text>
      </View>
    </Animated.View>
  )
}

Toast.success = (text: string) => {
  Emitter.emit('SHOW_TOAST_MESSAGE', { message: text, type: 'success' })
}

Toast.error = (text: string) => {
  Emitter.emit('SHOW_TOAST_MESSAGE', { message: text, type: 'error' })
}

Toast.info = (text: string) => {
  Emitter.emit('SHOW_TOAST_MESSAGE', { message: text, type: 'info' })
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    flex: 1,
    zIndex: 9999,
    position: 'absolute',
    bottom: -HEIGHT,
    left: Metrics.insets.horizontal,
    right: Metrics.insets.horizontal,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  message__container: {
    ...Styles.shadow,
    borderRadius: HEIGHT * 0.5,
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: HEIGHT,
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginLeft: isIphoneX() ? 15 : 20,
    fontWeight: '500',
    minWidth: 200,
    marginHorizontal: 5,
  },
  lottie: {
    width: 32,
    height: 32,
    position: 'absolute',
    left: 2,
  },
})

export default Toast
