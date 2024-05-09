import React, { useEffect, useRef } from 'react'
import { Animated, InteractionManager } from 'react-native'

type ZoomInType = {
  scale: Animated.Value
  opacity: Animated.Value
  animation: (delay: number) => void
}

const useZoomIn = (startDelay = 200, shouldDisableAnimation = false): ZoomInType => {
  const scale = useRef(new Animated.Value(shouldDisableAnimation ? 1 : 0)).current
  const opacity = useRef(new Animated.Value(shouldDisableAnimation ? 1 : 0)).current

  const zoomIn = (delay = 0) => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, delay }),
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, delay }),
    ]).start()
  }

  useEffect(() => {
    // If start delay, disable auto start animation
    if (startDelay === -1 || shouldDisableAnimation) return

    // else start animation after delay
    let timeout
    InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => zoomIn(), startDelay)
    })
    return () => clearTimeout(timeout)
  }, [])

  return { scale, opacity, animation: zoomIn }
}

export default useZoomIn
