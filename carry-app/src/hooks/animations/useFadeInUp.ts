import { useEffect, useState } from 'react'
import { Animated, InteractionManager } from 'react-native'

const useFadeInUp: (
  duration: number,
  startDelay?: number,
  endDelay?: number,
  autoAnim?: boolean,
) => [Animated.Value, Animated.Value, () => void, () => void] = (duration = 1000, startDelay = 200, endDelay = 0, autoAnim = true) => {
  const [opacity] = useState(new Animated.Value(0))
  const [translateY] = useState(new Animated.Value(50))

  const animation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const animationOut = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -25,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start()
  }

  useEffect(() => {
    if (!autoAnim) return
    let timeout
    let endTimeOut
    InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => animation(), startDelay)

      endTimeOut = endDelay && setTimeout(() => animationOut(), endDelay)
    })
    return () => {
      clearTimeout(timeout)
      endTimeOut && clearTimeout(endTimeOut)
    }
  }, [])

  return [opacity, translateY, animation, animationOut]
}

export default useFadeInUp
