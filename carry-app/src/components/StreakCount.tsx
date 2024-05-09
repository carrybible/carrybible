/**
 * StreakCount
 *
 * @format
 *
 */

import React, { useRef, useEffect } from 'react'
import { StyleSheet, View, StyleProp, ViewStyle, Animated } from 'react-native'
import LottieView from 'lottie-react-native'

import { Utils } from '@shared/index'
import Icon from './Icon'
import useTheme from '@hooks/useTheme'
import { H2, Text } from './Typography'
import useZoomIn from '@hooks/animations/useZoomIn'

interface StreakDayProps {
  day: string
  backgroundUncheck: any
  completed?: boolean
  isToday?: boolean
  animated?: boolean
}

const StreakDay: React.FC<StreakDayProps> = props => {
  const { color } = useTheme()
  const shouldEnableAnimation = props.animated && props.isToday && props.completed
  const { scale: zoomScale, opacity: zoomOpacity, animation: animate } = useZoomIn(-1, !shouldEnableAnimation)

  useEffect(() => {
    if (props.animated && props.completed && props.isToday) {
      animate(3000)
    }
  }, [])

  return (
    <View style={{ alignItems: 'center' }}>
      <Text bold>{props.day}</Text>
      <View style={[s.tick__border, { borderColor: props.isToday ? color.orange : 'transparent' }]}>
        <Animated.View
          style={{
            ...s.tick,
            backgroundColor: props.completed ? color.orange : props.backgroundUncheck,
            opacity: zoomOpacity,
            transform: [{ scaleX: zoomScale }, { scaleY: zoomScale }],
          }}
        >
          {props.completed && <Icon source="check" size={22} color={color.white} />}
        </Animated.View>
      </View>
    </View>
  )
}

interface Props {
  currentStreak?: number
  style: StyleProp<ViewStyle>
  streaks: Array<{ day: string; completed: boolean }>
  backgroundColor?: string
  space?: number
  animated?: boolean
  backgroundUncheck?: any
  isStartAnim?: boolean
}

const StreakCount: React.FC<Props> = props => {
  const { color } = useTheme()
  const lottie = useRef()
  const isAnimated = useRef(false)
  const logoScale = useRef(new Animated.Value(0.3)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (props.animated && props.isStartAnim && !isAnimated.current) {
      lottie.current?.play()
      Animated.parallel([Utils.animations.zoom(700, logoScale, 0), Utils.animations.fadeIn(700, logoOpacity, 0)]).start()

      isAnimated.current = true
    }
  }, [props.isStartAnim, props.animated])

  return (
    <View style={[s.container, props.style, { backgroundColor: props.backgroundColor || color.orange2 }]}>
      <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
        {props.animated ? (
          <Animated.View
            style={[
              s.lottie,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <LottieView
              ref={lottie}
              source={require('@assets/animations/flame.json')}
              style={[s.lottie, { marginTop: 10 }]}
              loop
              speed={0.7}
            />
          </Animated.View>
        ) : (
          <Icon color={color.orange} source={require('@assets/icons/ic-carry-fire-lg.png')} size={90} />
        )}
        <H2 color="white" align="center" style={{ position: 'absolute', top: 30, bottom: -10, left: 0, right: 0, lineHeight: 100 }}>
          {props.currentStreak || 0}
        </H2>
      </View>
      <View style={[s.dayStreak__container, { marginTop: props.space || 30 }]}>
        {props.streaks?.map((s, idx) => (
          <StreakDay
            key={`d-${idx.toString()}`}
            {...s}
            backgroundUncheck={props.backgroundUncheck || color.white}
            animated={props.animated}
          />
        ))}
      </View>
    </View>
  )
}

StreakCount.defaultProps = {}

const s = StyleSheet.create({
  container: {
    borderRadius: 25,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayStreak__container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 230,
  },
  lottie: {
    marginTop: 5,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick__border: {
    padding: 3,
    borderWidth: 1.5,
    marginTop: 5,
    borderRadius: 20,
  },
})

export default StreakCount
