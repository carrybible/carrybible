/**
 * Complete Goal
 *
 * @format
 *
 */

import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import ProgressBar from '@components/ProgressBar'
import { H2 } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Constants, LocalStorage } from '@shared/index'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import useGoalCompleteAnimation from './hooks/useGoalCompleteAnimation'

interface Props {
  route: RouteProp<Params, 'screen'>
}

type Params = {
  screen: {
    plan: StudyPlan.GroupPlan
    skipNavigateToGoalPreview?: boolean
    blockIndex?: number
    initTab?: string
    isNewStreak?: boolean
  }
}

const BlockCompletedScreen: React.FC<Props> = props => {
  const isNewStreak = props.route.params?.isNewStreak
  const me = useSelector<any, App.User>(state => state.me)
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { color } = useTheme()
  const [process, setProcess] = useState<number>(0)
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true)
  const { linear } = useLayoutAnimation()
  const lottie = useRef<LottieView>()
  const isInOnboardingFlow = useRef(false)
  const isHandling = useRef(false)

  const { plan, skipNavigateToGoalPreview } = props.route.params

  useEffect(() => {
    saveStateOnboarding()
  }, [])

  // For onboarding state
  const saveStateOnboarding = async () => {
    const onboardingState = await LocalStorage.getData(LocalStorage.keys.ONBOARDING_STATE)
    if (onboardingState && onboardingState.stack && onboardingState.stack.length > 0) {
      isInOnboardingFlow.current = true
      await LocalStorage.saveOnboardingState(Constants.SCENES.STUDY_PLAN.CURRENT_GOAL_COMPLETED, props?.route?.params)
    }
  }

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

  const onPressContinue = async () => {
    if (isHandling.current) return
    isHandling.current = true

    if (isNewStreak) {
      // Found new streak of day
      navigation.replace(Constants.SCENES.STUDY_PLAN.STREAK_ACHIEVED, {
        plan,
        initTab: 'Members',
        skipNavigateToGoalPreview,
      })
    } else if (plan.memberProgress[me.uid].isCompleted) {
      // This is the last block of study
      navigation.replace(Constants.SCENES.STUDY_PLAN.STUDY_COMPLETED, props.route.params)
      return
    } else {
      navigation.pop()
    }
    isHandling.current = false
  }

  return (
    <Container safe>
      <View style={s.container}>
        <View style={s.animation}>
          <LottieView
            ref={lottie}
            source={require('@assets/animations/677-trophy.json')}
            style={s.lottie}
            autoPlay={false}
            loop={false}
            autoSize={false}
          />
        </View>
        <Animated.View style={[s.progress, { opacity: anim.opacityState1 }]}>
          <ProgressBar style={s.bar} width={'100%'} value={process} color={color.accent} shining />
        </Animated.View>
        <Animated.View style={{ opacity: anim.opacityState1 }}>
          <H2 style={s.textBold}>{I18n.t('text.You reached your daily goal')}</H2>
        </Animated.View>
        {/* <Animated.View style={{ opacity: anim.opacityState2, transform: [{ translateY: anim.translateYLine1 }] }}>
          <View style={s.target}>
            <H3>{I18n.t('text.Reading completed')}</H3>
            <Icon style={{ marginLeft: 8 }} source={require('@assets/icons/ic-completed-goal.png')} color={color.accent} size={20} />
          </View>
        </Animated.View>
        <Animated.View style={{ opacity: anim.opacityState2, transform: [{ translateY: anim.translateYLine2 }] }}>
          <View style={s.target}>
            <H3>{I18n.t('text.Discussion completed')}</H3>
            <Icon style={{ marginLeft: 8 }} source={require('@assets/icons/ic-completed-goal.png')} color={color.accent} size={20} />
          </View>
        </Animated.View> */}
        <View style={s.spacer} />
      </View>
      <Animated.View style={[s.btnAnim, { opacity: anim.opacityState3, transform: [{ translateY: anim.translateYButton }] }]}>
        <BottomButton title={I18n.t('text.Continue')} rounded onPress={() => onPressContinue()} style={s.btn} />
      </Animated.View>
    </Container>
  )
}

const s = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  bar: { height: 16 },
  btnAnim: { width: '100%' },
  btn: { alignSelf: 'stretch' },
  animation: {
    flex: 1,
    alignItems: 'center',
    marginTop: '15%',
    padding: 15,
    width: 250,
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
  spacer: {
    flexGrow: 1,
  },
})

export default BlockCompletedScreen
