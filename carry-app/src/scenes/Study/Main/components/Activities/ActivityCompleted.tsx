/**
 * Complete Goal
 *
 * @format
 *
 */

import BottomButton from '@components/BottomButton'
import ProgressBar from '@components/ProgressBar'
import { H2 } from '@components/Typography'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import useGoalCompleteAnimation from '@scenes/Study/Achievement/hooks/useGoalCompleteAnimation'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

const ActivityCompleted: React.FC<any> = props => {
  const { color } = useTheme()
  const [process, setProcess] = useState<number>(0)
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true)
  const { linear } = useLayoutAnimation()
  const lottie = useRef<LottieView>(null)
  const { landscape } = useScreenMode()

  const delayProgress = () => {
    if (process == 100) {
      linear()
      return
    }
    setTimeout(
      async function () {
        if (isFirstRun) {
          setIsFirstRun(false)
        }
        linear()
        setProcess(process + 100)
      },
      isFirstRun ? 10 : 1000,
    )
  }
  const anim = useGoalCompleteAnimation(() => lottie.current?.play(), delayProgress)

  const onPressContinue = () => {
    props?.onPress()
  }

  return (
    <>
      <View style={[s.container, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
        <ScreenView containerProps={{ style: s.center }}>
          <View style={landscape ? s.centerFlex : s.alignCenter}>
            <View key={landscape ? 1 : 2} style={[s.animation, landscape ? s.lottieLand : s.top]}>
              <LottieView
                ref={lottie}
                source={require('@assets/animations/677-trophy.json')}
                style={s.lottie}
                autoPlay={false}
                loop={false}
                autoSize={false}
              />
            </View>
            <Animated.View style={[s.progress, { opacity: anim.opacityState1 }, landscape ? s.width40 : {}]}>
              <ProgressBar style={s.bar} width={'100%'} value={process} color={color.accent} shining />
            </Animated.View>
          </View>
          <View style={landscape ? s.centerFlex : {}}>
            <Animated.View style={{ opacity: anim.opacityState1 }}>
              <H2 style={s.textBold}>{I18n.t('text.You reached your daily goal')}</H2>
            </Animated.View>
          </View>
        </ScreenView>
      </View>
      <Animated.View style={[s.btnAnim, { opacity: anim.opacityState3, transform: [{ translateY: anim.translateYButton }] }]}>
        <BottomButton title={I18n.t('text.Continue')} rounded onPress={onPressContinue} style={s.btn} />
      </Animated.View>
    </>
  )
}

const s = StyleSheet.create({
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  alignCenter: { alignItems: 'center' },
  lottieLand: { marginTop: 0, width: Metrics.screen.width / 2.6, height: Metrics.screen.width / 3 },
  top: { marginTop: '25%' },
  width40: { width: '40%' },
  container: {
    flex: 1,
    marginBottom: Metrics.insets.horizontal,
    marginHorizontal: Metrics.insets.horizontal,
    borderRadius: 20,
  },
  bar: { height: 16 },
  btnAnim: { width: '100%' },
  btn: { alignSelf: 'stretch' },
  animation: {
    alignItems: 'center',
    padding: 15,
    width: Metrics.screen.width / 1.5,
    height: Metrics.screen.width / 1.5,
  },
  progress: {
    width: '70%',
    marginTop: 8,
    alignItems: 'center',
  },
  textBold: {
    width: '100%',
    textAlign: 'center',
    marginTop: 38,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  lottie: {
    flex: 1,
  },
})

export default ActivityCompleted
