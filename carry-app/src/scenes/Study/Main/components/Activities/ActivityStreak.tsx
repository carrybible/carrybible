/**
 * Complete Streak
 *
 * @format
 *
 */

import BottomButton from '@components/BottomButton'
import StreakCount from '@components/StreakCount'
import { H2, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { Constants, Reminder as SharedReminder, Metrics } from '@shared/index'
import Utils, { getStreaChecklList } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

interface Props {
  plan: StudyPlan.GroupPlan
  onPress: () => void
}
const ActivityStreak: React.FC<Props> = props => {
  const { plan } = props
  const dispatch = useDispatch()
  const me = useSelector<any, App.User>(state => state.me)
  const local = useSelector<any, any>(state => state.local)
  const { color } = useTheme()
  const [startSteakAnim, setSteakAnim] = useState(false)
  const { landscape } = useScreenMode()

  const opacityState1 = useRef(new Animated.Value(0)).current
  const opacityState3 = useRef(new Animated.Value(0)).current

  const translateYText = useRef(new Animated.Value(50)).current
  const translateYButton = useRef(new Animated.Value(70)).current

  useEffect(() => {
    if (me === undefined) return
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

  const onPressContinue = () => {
    props?.onPress()
  }

  return (
    <>
      <View style={[s.flex, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
        <ScreenView containerProps={{ style: s.center }}>
          <View style={landscape ? s.centerFlex : s.alignCenter}>
            <View key={landscape ? 1 : 2} style={[s.animation, landscape ? s.lottieLand : s.top0]}>
              <StreakCount
                animated
                currentStreak={me.currentStreak || 1}
                style={landscape ? s.imageWrapperLand : s.imageWrapper}
                streaks={getStreaChecklList(me)}
                backgroundColor={'transparent'}
                backgroundUncheck={color.gray7}
                space={0}
                isStartAnim={startSteakAnim}
              />
            </View>
          </View>
          <Animated.View
            style={[s.textWrapper, { opacity: opacityState1, transform: [{ translateY: translateYText }] }, landscape ? s.centerFlex : {}]}>
            <H2 style={s.title}>{I18n.t('params.streaks', { currentStreak: me.currentStreak || 1 })}</H2>
            <Text style={[s.subtext, { color: color.gray3 }]}>
              {I18n.t('text.Keep the momentum going by reading and engaging with your group daily')}
            </Text>
          </Animated.View>
        </ScreenView>
      </View>
      <Animated.View style={[s.bottomBtn, { opacity: opacityState3, transform: [{ translateY: translateYButton }] }]}>
        <BottomButton title={I18n.t('text.Finish')} rounded onPress={onPressContinue} />
      </Animated.View>
    </>
  )
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  alignCenter: { alignItems: 'center' },
  lottieLand: { marginTop: 0, width: Metrics.screen.width / 2.6, height: Metrics.screen.width / 3 },
  top0: { marginTop: 0 },
  flex: {
    alignItems: 'center',
    flex: 1,
    marginBottom: Metrics.insets.horizontal,
    marginHorizontal: Metrics.insets.horizontal,
    borderRadius: 20,
  },
  imageWrapperLand: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    marginTop: Dimensions.get('window').height * 0.08,
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
  bottomBtn: { width: '100%' },
})

export default ActivityStreak
