import { H3, Subheading, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import Emitter from '@shared/Emitter'
import Metrics from '@shared/Metrics'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'

const HEIGHT = 145 //Metrics.header.height + Metrics.status.height
const TRANSLATEY = (Metrics.status.height || 0) + HEIGHT + (Platform.OS === 'android' ? 13 : 5)

const InAppNotification = () => {
  const [state, setState] = useState<{
    title: string
    message: string
    onPress?: () => void
    btnLabel?: string
  }>({
    title: '',
    message: '',
    onPress: undefined,
    btnLabel: '',
  })
  const lottie = useRef<LottieView>()
  const offset = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const [duration] = useState(300)
  const { color: theme } = useTheme()
  const currentId = useRef<any>()

  const onClose = useCallback(() => {
    Animated.sequence([
      // Fade Out
      Animated.parallel([
        Animated.timing(offset, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  useEffect(() => {
    const idOpen = Emitter.on('SHOW_NOTIFICATION', ({ title, message, onPress, btnLabel, id }) => {
      if (!title || !message) {
        return
      }
      currentId.current = id
      offset.setValue(HEIGHT)

      lottie.current?.play?.()

      Animated.sequence([
        Animated.delay(100),
        // Fade In
        Animated.parallel([
          Animated.timing(offset, {
            toValue: TRANSLATEY,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]),
      ])?.start(() => {
        lottie.current?.reset?.()
        setState({ title, message, onPress, btnLabel })
      })
    })

    const idClose = Emitter.on('CLOSE_NOTIFICATION_WITH_CONDITION', ({ id }) => {
      if (currentId.current === id) {
        onClose?.()
      }
    })

    return () => {
      Emitter.rm(idOpen)
      Emitter.rm(idClose)
    }
  }, [onClose])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: offset }],
          opacity,
        },
      ]}>
      <View
        style={{
          backgroundColor: theme.middle,
          ...styles.message__container,
        }}>
        <H3 style={styles.title} color={'primary'} numberOfLines={1}>
          {state.title}
        </H3>
        <View style={styles.flex}>
          <Text style={styles.message} numberOfLines={3}>
            {state.message}
          </Text>
        </View>
        <View style={styles.btns}>
          <TouchableOpacity onPress={onClose} style={styles.dismiss}>
            <Subheading color="gray2">{I18n.t('text.Dismiss')}</Subheading>
          </TouchableOpacity>
          {state.onPress ? (
            <TouchableOpacity
              onPress={() => {
                onClose()
                state.onPress?.()
              }}
              style={styles.dismiss}>
              <Subheading color="accent">{state.btnLabel || I18n.t('text.Open')}</Subheading>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animated.View>
  )
}

InAppNotification.show = ({
  title,
  text,
  onPress,
  btnLabel,
  id,
}: {
  title: string
  text: string
  onPress?: () => void
  btnLabel?: string
  id?: string
}) => {
  Emitter.emit('SHOW_NOTIFICATION', { title, message: text, onPress, btnLabel, id })
}

InAppNotification.closeWithCondition = (id: string) => {
  Emitter.emit('CLOSE_NOTIFICATION_WITH_CONDITION', { id })
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    height: HEIGHT,
    flex: 1,
    zIndex: 9999,
    position: 'absolute',
    top: -HEIGHT,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  message__container: {
    ...Styles.shadow,
    borderRadius: 8,

    paddingHorizontal: 10,
    height: HEIGHT,
    alignItems: 'flex-start',
    width: Metrics.screen.width - 15,
  },
  title: {
    textAlign: 'left',
    marginHorizontal: 10,
    fontWeight: '600',
    minWidth: 200,
    marginTop: 16,
  },
  message: {
    textAlign: 'left',
    marginHorizontal: 10,
    minWidth: 200,
    marginTop: 8,
  },
  dismiss: {
    alignSelf: 'flex-end',
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 15,
  },
  btns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%' },
})

export default InAppNotification
