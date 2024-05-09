import React, { useEffect, useState } from 'react'
import { Animated, Keyboard, KeyboardEvent, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useKeyboard = (): [number] => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  function onKeyboardDidShow(e: KeyboardEvent): void {
    setKeyboardHeight(e.endCoordinates.height)
  }

  function onKeyboardDidHide(): void {
    setKeyboardHeight(0)
  }

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)
    return (): void => {
      keyboardDidShow.remove()
      keyboardDidHide.remove()
    }
  }, [])

  return [keyboardHeight]
}

export const useKeyboardPadding = ({
  androidEnable = false,
  extraPadding = 0,
  useKeyboardHeight = true,
}: {
  androidEnable?: boolean
  extraPadding?: number
  useKeyboardHeight?: boolean
} = {}): Animated.Value => {
  const keyboardPadding = React.useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()
  const [keyboardHeight] = useKeyboard()
  React.useEffect(() => {
    if (keyboardHeight && (androidEnable || Platform.OS === 'ios')) {
      let toValue = -extraPadding + insets.bottom
      if (useKeyboardHeight) {
        toValue -= keyboardHeight
      }
      Animated.timing(keyboardPadding, {
        duration: 250,
        toValue: toValue,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(keyboardPadding, {
        duration: 250,
        toValue: 0,
        useNativeDriver: true,
      }).start()
    }
  }, [androidEnable, extraPadding, insets.bottom, keyboardHeight, keyboardPadding, useKeyboardHeight])

  return keyboardPadding
}
