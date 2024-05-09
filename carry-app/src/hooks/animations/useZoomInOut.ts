import { useEffect, useRef } from 'react'
import { Animated, InteractionManager } from 'react-native'

const useZoomInOut = (startDelay = 200, direction: 'in' | 'out' = 'in', animationCallback = (dir: 'in' | 'out') => {}) => {
  const [start, end] = direction === 'in' ? [0, 1] : [1, 0]
  const scale = useRef(new Animated.Value(start)).current
  const opacity = useRef(new Animated.Value(start)).current

  const zoomInOut = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: end, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: end, useNativeDriver: true }),
    ]).start(() => {
      if (animationCallback) {
        animationCallback(direction)
      }
    })
  }

  useEffect(() => {
    let timeout
    InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => zoomInOut(), startDelay)
    })
    return () => clearTimeout(timeout)
  }, [direction])

  return [scale, opacity]
}

export default useZoomInOut
