import React, { useRef } from 'react'
import { Animated as RnAnimated, StyleSheet, TouchableWithoutFeedback } from 'react-native'

import { useKeyboard, useKeyboardPadding } from '@hooks/useKeyboard'
import Animated, { runOnJS, useAnimatedGestureHandler, withSpring } from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'

const TransparentNavigation: React.FC<{
  onPress?: () => void
  mode: 'left' | 'right'
  width: number
  hideWhenShowKeyboard?: boolean
}> = ({ onPress, mode, width, hideWhenShowKeyboard = true }) => {
  const keyboardPadding = useKeyboardPadding()
  const [keyboardHeight] = useKeyboard()
  const event = useRef('')

  const setEvent = e => {
    event.current = e
  }

  const finish = () => {
    if (event.current === 'start') onPress?.()
  }

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet'
      runOnJS(setEvent)('start')
    },
    onActive: () => {
      'worklet'
      runOnJS(setEvent)('active')
    },
    onFinish: () => {
      'worklet'
      runOnJS(finish)()
    },
    onEnd: _ => {
      'worklet'
      runOnJS(setEvent)('end')
    },
  })

  if (hideWhenShowKeyboard && keyboardHeight > 0) {
    return null
  }
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          styles.navigation,
          // eslint-disable-next-line react-native/no-inline-styles
          {
            [mode]: 0,
            width,
          },
        ]}>
        <RnAnimated.View
          style={[
            styles.navigation,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              [mode]: 0,
              width,
              transform: [
                {
                  translateY: keyboardPadding,
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </PanGestureHandler>
  )
}

const styles = StyleSheet.create({
  navigation: {
    position: 'absolute',
    top: 50,
    bottom: 100,
  },
})

export default TransparentNavigation
