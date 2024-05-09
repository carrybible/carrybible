/**
 * Twinkle View
 *
 * @format
 *
 */

import React, { useRef, useEffect } from 'react'
import { StyleSheet, Animated, Easing } from 'react-native'
import { H2 } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Styles } from '@shared/index'

interface Props {
  init?: number
  title: string
  x: string
  y: string
  isStop?: boolean
}

const Twinkle: React.FC<Props> = props => {
  const { color } = useTheme()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const isStop = useRef(props.isStop || false)
  const currentAnim = useRef<any>()
  const isAnimRunning = useRef<boolean>(false)

  useEffect(() => {
    if (!props.isStop) {
      runAnim(props.init, 1)
    }
  }, [])

  useEffect(() => {
    if (props.isStop) {
      // request stop
      if (!isStop.current) {
        isStop.current = true
      }
    } else {
      // request run
      if (isStop.current) {
        if (isAnimRunning.current === false) {
          runAnim(props.init, 1)
        } else {
          isStop.current = false
        }
      }
    }
  }, [props.isStop])

  const runAnim = (oldValue, nextValue: number) => {
    isAnimRunning.current = true
    currentAnim.current = Animated.timing(fadeAnim, {
      toValue: nextValue,
      duration: 2000 * Math.abs(nextValue - oldValue),
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      if (!(isStop.current && nextValue === 0)) {
        runAnim(nextValue, nextValue === 1 ? 0 : 1)
      } else {
        isAnimRunning.current = false
      }
    })
  }

  return (
    <Animated.View
      style={[
        s.container,
        {
          backgroundColor: color.middle,
          top: props.x,
          left: props.y,
          opacity: fadeAnim,
        },
      ]}
    >
      <H2 color="white">{props.title}</H2>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 15,
    ...Styles.shadow2,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default Twinkle
