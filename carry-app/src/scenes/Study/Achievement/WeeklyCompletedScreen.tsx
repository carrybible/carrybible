import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import { H1, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import I18n from '@shared/I18n'
import Reminder from '@shared/Reminder'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

const WeeklyCompleted = props => {
  const me = useSelector<any, App.User>(state => state.me)
  const isNewStreak = props.route.params?.isNewStreak
  const {
    plan,
    blockIndex,
    skipNavigateToGoalPreview,
  }: { plan: StudyPlan.GroupPlan; blockIndex: number; skipNavigateToGoalPreview: boolean } = props.route.params
  const anim = useRef(new Animated.Value(0)).current
  const { color } = useTheme()
  const lottieTick = useRef()
  const [fadeInOpacityButton, translateY] = useFadeInUp(500, 500)
  const [currentPlan, setCurrentPlan] = useState<StudyPlan.GroupPlan>()
  const Analytics = useAnalytic()

  // Sync active goal
  useEffect(() => {
    if (!plan || !plan?.targetGroupId) return
    const ref = Firestore.Group.planRef(plan.targetGroupId || '', plan.id)
    const unsubscribe = ref?.onSnapshot(snap => {
      if (snap) {
        const planData: any = snap.data()
        if (planData) {
          setCurrentPlan(planData)
        }
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [plan])

  useEffect(() => {
    // Clean all reminder for week:
    Reminder.cancelNotification(Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_3.toString())
    Reminder.cancelNotification(Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_5.toString())
    Reminder.cancelNotification(Constants.REMINDER_COMPELETE_WEEK_ADVANCED_DAY_6.toString())
  }, [])

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.WEEK_COMPLETED_SCREEN)
    setTimeout(() => {
      lottieTick.current?.play()
    }, 500)

    Animated.timing(anim, {
      toValue: 1,
      easing: Easing.back(),
      duration: 1000,
      delay: 0,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <Container safe style={{ flex: 1, backgroundColor: color.background }}>
      <View style={[s.container, { backgroundColor: color.background }]}>
        <Animated.View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            marginTop: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }}
        >
          <LottieView ref={lottieTick} source={require('@assets/animations/tick.json')} style={[s.lottieTick]} loop={false} speed={0.5} />
          <H1 style={{ marginTop: 32 }}>{I18n.t('text.week completed', { number: blockIndex })}</H1>
          <Text style={{ textAlign: 'center', maxWidth: '70%', marginTop: 30 }}>
            {I18n.t('text.weekly message')}
            <Text bold>{` ${currentPlan?.memberProgress?.[me.uid]?.percent || 0}% `}</Text>
            {I18n.t('text.weekly message 2')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ width: '100%', opacity: fadeInOpacityButton, transform: [{ translateY: translateY }] }}>
        <BottomButton
          title={I18n.t('text.Continue')}
          rounded
          onPress={() => {
            if (isNewStreak) {
              props.navigation.replace(Constants.SCENES.STUDY_PLAN.STREAK_ACHIEVED, {
                plan,
                skipNavigateToGoalPreview,
                blockIndex,
                initTab: 'Members',
              })
            } else {
              if (plan.memberProgress[me.uid]?.isCompleted) {
                props.navigation.replace(Constants.SCENES.STUDY_PLAN.STUDY_COMPLETED, props.route.params)
              } else {
                props.navigation.pop()
              }
            }
          }}
          style={{ alignSelf: 'stretch' }}
        />
      </Animated.View>
    </Container>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: { marginBottom: 32 },
  lottieTick: { width: 126, height: 126 },
})

export default WeeklyCompleted
