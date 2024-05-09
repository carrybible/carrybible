import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, InteractionManager } from 'react-native'

const useFadeIn = (duration = 1000, startDelay = 200, autoStart = true) => {
  const opacity = useRef(new Animated.Value(0)).current

  const animation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start()
  }

  useEffect(() => {
    if (!autoStart) return
    let timeout
    InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => animation(), startDelay)
    })
    return () => clearTimeout(timeout)
  }, [])

  const runAnim = useCallback(() => {
    animation()
  }, [])

  return [opacity, runAnim]
}

export default useFadeIn
