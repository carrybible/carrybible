import { Utils } from '@shared/index'
import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

function useGoalCompleteAnimation(callback?: () => void, delay?: () => void) {
  const opacityState1 = useRef(new Animated.Value(0)).current
  const opacityState2 = useRef(new Animated.Value(0)).current
  const opacityState3 = useRef(new Animated.Value(0)).current

  const translateYLine1 = useRef(new Animated.Value(50)).current
  const translateYLine2 = useRef(new Animated.Value(70)).current
  const translateYButton = useRef(new Animated.Value(70)).current

  const logoScale = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const config = {
      state1Time: 1000,
      state2Time: 1000,
      state3Time: 500,
    }

    // Show up process bar
    Utils.animations.fadeIn(config.state1Time - 500, opacityState1, 0).start(() => {
      if (delay) delay()
    })

    // Fade in logo and line 1, 2
    setTimeout(() => {
      if (callback) callback()
    }, config.state1Time)
    Utils.animations.fadeIn(config.state2Time, opacityState2, config.state1Time).start()
    Utils.animations.zoom(config.state2Time, logoScale, config.state1Time).start()
    Utils.animations.moveUp(config.state2Time, translateYLine1, config.state1Time).start()
    Utils.animations.moveUp(config.state2Time, translateYLine2, config.state1Time).start()

    // Fade in button
    Utils.animations.fadeIn(config.state3Time, opacityState3, config.state1Time + config.state2Time).start()
    Utils.animations.moveUp(config.state3Time, translateYButton, config.state1Time + config.state2Time).start()

    // const anims = [animState1, animState2, iconScale, line1Y, line2Y, animState3, buttonY]
    // return () => {}
  }, [])

  return { opacityState1, opacityState2, opacityState3, translateYLine1, translateYLine2, translateYButton, logoScale }
}

export default useGoalCompleteAnimation
