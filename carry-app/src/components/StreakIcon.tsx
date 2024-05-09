import useTheme from '@hooks/useTheme'
import { useIsFocused } from '@react-navigation/native'
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, FadeIn, FadeInRight, FadeOut, FadeOutLeft, ZoomIn } from 'react-native-reanimated'

type Props = {
  count: number
  isCompleteTodayStudy: boolean
}

const StreakIcon: React.FC<Props> = ({ isCompleteTodayStudy, count }) => {
  const { color } = useTheme()

  return (
    <View style={styles.wrapper}>
      {isCompleteTodayStudy ? (
        <Animated.Image
          key={isCompleteTodayStudy + ''}
          entering={ZoomIn.easing(Easing.elastic(3)).duration(1000)}
          exiting={FadeOutLeft}
          source={require('@assets/icons/ic-fire-filled.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : (
        <Animated.Image
          key={isCompleteTodayStudy + ''}
          entering={FadeIn.delay(150)}
          exiting={FadeOut}
          source={require('@assets/icons/ic-fire.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      )}
      <Animated.Text key={count} entering={FadeInRight.delay(150)} exiting={FadeOut} style={[styles.text, { color: color.orange }]}>
        {count}
      </Animated.Text>
    </View>
  )
}

const CachedStreakIcon: React.FC<Props> = props => {
  const isFocus = useIsFocused()
  const isFocusRef = useRef(isFocus)
  const latestProps = useRef<Props>(props)
  const [renderingProps, setRenderingProps] = useState(() => props)

  useEffect(() => {
    isFocusRef.current = isFocus
  }, [isFocus])

  useEffect(() => {
    latestProps.current = {
      isCompleteTodayStudy: props.isCompleteTodayStudy,
      count: props.count,
    }

    if (isFocusRef.current) {
      setRenderingProps(latestProps.current)
    }
  }, [props.isCompleteTodayStudy, props.count])

  // Whenever isFocus change from false -> true, we need to ensure user will stay there at least 1.5 seconds
  // before render the up-to-date component
  useEffect(() => {
    let timeoutId
    if (isFocus) {
      timeoutId = setTimeout(() => {
        setRenderingProps(latestProps.current)
      }, 1500)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isFocus])

  return <StreakIcon {...renderingProps} />
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 4,
  },
  text: {
    fontWeight: 'bold',
  },
})

export default React.memo(CachedStreakIcon)
