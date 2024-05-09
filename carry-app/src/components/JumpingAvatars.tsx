import React, { FC, ReactElement, useEffect, useMemo } from 'react'
import { InteractionManager, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  data?: ReactElement[]
  itemSize?: number
  overlapPercent?: number
  delayTime?: number
  duration?: number
  jumpHeight?: number
  delayStart?: number
  isRunning?: boolean
}

const JumpingAvatars: FC<Props> = ({
  data = [],
  itemSize = 35,
  overlapPercent = 0.25,
  delayTime = 100,
  duration = 400,
  jumpHeight = 8.75,
  delayStart = 500,
  isRunning = true,
}) => {
  const Items = useMemo(() => {
    return data.map((value, index) => {
      const marginLeft = index > 0 ? -itemSize * overlapPercent : 0
      return (
        <Jumping
          style={{ marginLeft }}
          key={index}
          delay={delayTime * index}
          jumpHeight={jumpHeight}
          itemSize={itemSize}
          duration={duration}
          delayStart={delayStart}
          isRunning={isRunning}
        >
          {value}
        </Jumping>
      )
    })
  }, [data, delayTime, duration, itemSize, jumpHeight, overlapPercent])

  return <View style={[s.container, { height: itemSize + jumpHeight }]}>{Items}</View>
}

const Jumping = ({
  delay,
  jumpHeight,
  itemSize,
  children,
  duration,
  delayStart,
  style,
  isRunning,
}: {
  delay: number
  jumpHeight: number
  itemSize: number
  children: ReactElement
  duration: number
  style: StyleProp<ViewStyle>
  delayStart: number
  isRunning: boolean
}) => {
  const distance = useSharedValue(jumpHeight)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (isRunning) {
        distance.value = withDelay(
          delay,
          withRepeat(
            withDelay(delayStart, withSequence(withTiming(0, { duration: duration }), withTiming(jumpHeight, { duration: duration }))),
            -1,
            false,
          ),
        )
      } else {
        distance.value = withSpring(jumpHeight)
      }
    })
  }, [isRunning])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      marginTop: distance.value,
    }
  })

  return (
    <View style={[{ height: itemSize + jumpHeight, width: itemSize }, style]}>
      <Animated.View style={[{ height: itemSize, width: itemSize }, animatedStyles]}>{children}</Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
})

export default JumpingAvatars
