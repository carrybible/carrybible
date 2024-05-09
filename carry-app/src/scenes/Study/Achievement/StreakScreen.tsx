/**
 * Complete Streak
 *
 * @format
 *
 */

import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Share, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import StreakCount from '@components/StreakCount'
import { H2, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, LocalStorage, Reminder as SharedReminder } from '@shared/index'
import Utils, { getStreaChecklList } from '@shared/Utils'

interface Props {
  route: RouteProp<Params, 'screen'>
}

type Params = {
  screen: {
    plan: StudyPlan.GroupPlan
    initTab: string
    skipNavigateToGoalPreview?: boolean
  }
}

const Streak: React.FC<Props> = props => {
  const { plan, initTab, skipNavigateToGoalPreview } = props.route.params
  const dispatch = useDispatch()
  const me = useSelector<any, App.User>(state => state.me)
  const local = useSelector<any, any>(state => state.local)
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { color } = useTheme()
  const [startSteakAnim, setSteakAnim] = useState(false)
  const Analytics = useAnalytic()

  const opacityState1 = useRef(new Animated.Value(0)).current
  const opacityState3 = useRef(new Animated.Value(0)).current

  const translateYText = useRef(new Animated.Value(50)).current
  const translateYButton = useRef(new Animated.Value(70)).current

  const isInOnboardingFlow = useRef(false)
  const isHandling = useRef(false) // Prevent push double notification screen

  useEffect(() => {
    if (me === undefined) return
    saveStateOnboarding()
    setupNotification()

    const config = {
      state1Time: 500,
      state3Time: 500,
    }

    // Show up text
    Animated.parallel([
      Utils.animations.fadeIn(config.state1Time, opacityState1),
      Utils.animations.moveUp(config.state1Time, translateYText),
    ]).start(({ finished }) => {
      if (finished) {
        setSteakAnim(true)
      }
    })
    Animated.parallel([
      Utils.animations.fadeIn(config.state3Time, opacityState3, config.state1Time + 200),
      Utils.animations.moveUp(config.state3Time, translateYButton, config.state1Time + 200),
    ]).start()
  }, [me])

  const setupNotification = () => {
    // Cancel notification
    SharedReminder.cancelNotification(Constants.STREAK_NOTIFICATION_ID.toString())
    SharedReminder.cancelNotification(Constants.STREAK_WARNING_NOTIFICATION_ID.toString())

    // Create new notification after 23.5h with id 100
    SharedReminder.scheduleStreak(me, plan, plan.targetGroupId || '')

    // Create new notification to notication with id 101
    SharedReminder.scheduleWarningStreak(me, plan, plan.targetGroupId || '')
  }

  const onPressContinue = async () => {
    if (isHandling.current) return
    isHandling.current = true

    if (plan.memberProgress[me.uid]?.isCompleted) {
      navigation.replace(Constants.SCENES.STUDY_PLAN.STUDY_COMPLETED, props.route.params)
      return
    }

    // user not in onboarding flow
    navigation.pop()
    if (!skipNavigateToGoalPreview)
      navigation.navigate(Constants.SCENES.GROUP_HOME, {
        initTab: initTab,
        isFromSteak: true,
      })
    isHandling.current = false
  }

  const onPressInvite = async () => {
    const [dl, _id] = await Firestore.Group.generateDynamicLink({ id: plan.targetGroupId })
    if (dl) {
      Analytics.event(Constants.EVENTS.GROUP.INVITED)
      await Share.share(
        {
          title: I18n.t('text.Invite friends to Carry'),
          message: `Let’s build a Bible habit together on Biblegroups! It’s an app for staying accountable & motivated to read the Bible together, every day. Join my group at ${dl}`,
        },
        { tintColor: color.accent },
      )
    }
  }

  // For onboarding state
  const saveStateOnboarding = async () => {
    const onboardingState = await LocalStorage.getData(LocalStorage.keys.ONBOARDING_STATE)
    if (onboardingState && onboardingState.stack && onboardingState.stack.length > 0) {
      isInOnboardingFlow.current = true
      await LocalStorage.saveOnboardingState(Constants.SCENES.STUDY_PLAN.STREAK_ACHIEVED, props?.route?.params)
    }
  }

  return (
    <Container safe>
      <StreakCount
        animated
        currentStreak={me.currentStreak || 1}
        style={s.imageWrapper}
        streaks={getStreaChecklList(me)}
        backgroundColor={'transparent'}
        backgroundUncheck={color.gray7}
        space={45}
        isStartAnim={startSteakAnim}
      />
      <Animated.View style={[s.textWrapper, { opacity: opacityState1, transform: [{ translateY: translateYText }] }]}>
        <H2 style={s.title}>{I18n.t('params.streaks', { count: me.currentStreak || 1 })}</H2>
        <Text style={[s.subtext, { color: color.gray3 }]}>{I18n.t('text.Read and discuss everyday to increase your streak')}</Text>
      </Animated.View>
      <View style={s.spacer} />
      <Animated.View style={[s.bottomBtn, { opacity: opacityState3, transform: [{ translateY: translateYButton }] }]}>
        <BottomButton
          title={I18n.t('text.Invite a friend')}
          textColor="accent"
          backgroundColor="blue2"
          rounded
          onPress={onPressInvite}
          style={s.bottom}
        />
        <BottomButton title={I18n.t('text.Continue')} rounded onPress={onPressContinue} />
      </Animated.View>
    </Container>
  )
}

const s = StyleSheet.create({
  imageWrapper: {
    width: '100%',
    marginTop: Dimensions.get('window').height * 0.15,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 30,
  },
  subtext: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  textWrapper: {
    width: '100%',
    paddingHorizontal: 82,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flexGrow: 1,
  },
  bottom: { marginBottom: 10 },
  bottomBtn: { width: '100%' },
})

export default Streak
