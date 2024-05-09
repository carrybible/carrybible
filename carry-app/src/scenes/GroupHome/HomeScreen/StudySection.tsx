import { Title } from '@components/Typography'
import { RootState } from '@dts/state'
import useDirectMessageChannelId from '@hooks/useDirectMessageChannelId'
import useInitStudyPlanData from '@hooks/useInitStudyPlanData'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { useIsFocused } from '@react-navigation/native'
import useFinishDailyFlowAnimation from '@scenes/GroupHome/HomeScreen/useFinishDailyFlowAnimation'
import useStreak from '@scenes/Study/Achievement/hooks/useStreak'
import { NavigationRoot } from '@scenes/root'
import StreamIO from '@shared/StreamIO'
import { checkShowedDayIntro, getDateFromFirestoreTime, getPeriodNumber } from '@shared/Utils'
import { Constants, Firestore, Metrics } from '@shared/index'
import { differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'
import { GradientCover } from '../components/ConnectionView'
import StartStudyHint from '../components/Hints/StartStudyHint'
import { HomeButtonStyle } from './constant'

const useStudyState = ({ plan, blockIndex, progress, group, triggerFinishStudyAnimation, remindDaily }) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { showLoading, hideLoading } = useLoading()
  const isEndedPlan = !plan || plan.status === 'ended'
  const isNotStarted = blockIndex === 0
  const isHalfwayStudy = !!progress?.[blockIndex] && !progress?.[blockIndex]?.isCompleted
  const isFinishedStudy = progress?.[blockIndex]?.isCompleted
  let shouldBlur = false
  let text = '...'
  let onPress
  let buttonStyle = HomeButtonStyle.BLUE
  let icon
  let shouldShowHomeOverlay = false

  useFinishDailyFlowAnimation({
    triggerFinishStudyAnimation,
    isFinishedStudy,
    group,
    me,
  })

  useEffect(() => {
    if (remindDaily && plan && progress) {
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
        plan,
        block: plan?.blocks[blockIndex - 1],
        blockIndex: blockIndex,
        progress: progress?.[blockIndex],
      })
    }
  }, [remindDaily, blockIndex, plan, progress])

  const channelOwnerId = useDirectMessageChannelId(group.owner)

  if (!group.created) {
    return { text, shouldBlur, buttonStyle }
  }

  if (isEndedPlan) {
    text = group.isOwner ? I18n.t('text.Set a new group study') : I18n.t('text.Remind leader to set new study')
    onPress = group.isOwner
      ? () => {
          NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
            groupId: group.id,
          })
        }
      : () => {
          // Remind Admin to set new group Study
          StreamIO.client.channel('messaging', channelOwnerId).sendMessage({
            text: I18n.t('text.Reminder The goal is not set'),
          })

          toast.success(I18n.t('text.Remind sent'))
        }
  } else if (isNotStarted) {
    const daysNumber = differenceInDays(getDateFromFirestoreTime(plan.startDate), Date.now()) + 1
    text = I18n.t('text.Starting study in', {
      daysNumber: daysNumber,
      dayLabel: daysNumber > 1 ? I18n.t('text.days') : I18n.t('text.day'),
    })
    shouldBlur = true
  } else if (isHalfwayStudy) {
    text = I18n.t(`text.Finish todays study`)
    onPress = async () => {
      const planUpdated = await Firestore.Group.triggerCreateMessage(plan, blockIndex, showLoading, hideLoading)
      // This is for speed up invite generation, so we will pre-generated the invite link and cache locally
      // https://github.com/carrybible/carry-issues/issues/9
      Firestore.Group.generateDynamicLink({ id: group.id })
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
        plan: planUpdated,
        block: planUpdated?.blocks[blockIndex - 1],
        blockIndex: blockIndex,
        progress: progress?.[blockIndex],
      })
    }
  } else if (isFinishedStudy) {
    text = I18n.t(`text.Revisit todays study`)
    shouldBlur = false
    buttonStyle = HomeButtonStyle.WHITE
    icon = require('@assets/icons/ic-check-carry.png')
    onPress = async () => {
      const planUpdated = await Firestore.Group.triggerCreateMessage(plan, blockIndex, showLoading, hideLoading)
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
        plan: planUpdated,
        block: planUpdated?.blocks[blockIndex - 1],
        blockIndex: blockIndex,
        progress: progress?.[blockIndex],
        isRedo: true,
      })
    }
  } else if (plan) {
    shouldShowHomeOverlay = me.buttonOverlayGroups?.includes(group.id) || false
    text = I18n.t(`text.Start todays study`)
    onPress = async () => {
      const planUpdated = await Firestore.Group.triggerCreateMessage(plan, blockIndex, showLoading, hideLoading)
      const showed = await checkShowedDayIntro(plan, blockIndex)
      if (!showed) {
        await new Promise(resolve => {
          NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.DAY_INTRO, {
            onConfirm: () => resolve(true),
            plan: planUpdated,
            blockIndex,
          })
        })
      }

      NavigationRoot[!showed ? 'replace' : 'navigate'](Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
        plan: planUpdated,
        block: planUpdated?.blocks[blockIndex - 1],
        blockIndex: blockIndex,
        progress: progress?.[blockIndex],
        useFadeTransition: !showed,
      })
    }
  }

  return { text, shouldBlur, buttonStyle, icon, onPress, shouldShowHomeOverlay }
}

const StudyBackground: React.FC<{ children: any; isFinishedStudy: boolean; showGiving: boolean }> = props => {
  return (
    <GradientCover
      style={[styles.infoWrapper, props.showGiving && styles.flex0, props.showGiving && styles.gradientView]}
      borderRadius={18}
      inActive={props.isFinishedStudy}>
      <LinearGradient
        colors={['#115E8C', '#146897', '#3980AA', '#7B97C2', '#A6A2CB', '#D8ABC8', '#D9AAC2', '#D9AAC2']}
        style={[styles.linear, props.showGiving && styles.flex0]}>
        <View style={styles.overlay}>{props.children}</View>
      </LinearGradient>
    </GradientCover>
  )
}

const StudySection: React.FC<{ loading: boolean; remindDaily: boolean; showGiving: boolean }> = ({ loading, remindDaily, showGiving }) => {
  const { color, typography } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { currentScreen } = useSelector<RootState, RootState['screen']>(state => state.screen)
  const { plan, blockIndex, progress } = useInitStudyPlanData()
  const { isStreakAdded } = useStreak()
  const streakRemindShowed = useRef(false)
  const endedPlan = useRef(false)
  const { showLoading, hideLoading } = useLoading()
  const [buttonY, setButtonY] = useState(0)
  const isFinishedStudy = progress?.[blockIndex]?.isCompleted
  const isHomeScreenFocus = useIsFocused()
  const { landscape } = useScreenMode()

  const animatedProgress = useRef(new Animated.Value(0))
  const triggerFinishStudyAnimation = (animated = true) => {
    return new Promise<void>(resolve => {
      if (animated) {
        Animated.timing(animatedProgress.current, {
          toValue: 1,
          useNativeDriver: true,
          duration: 2500,
          delay: 500,
        }).start(() => resolve())
      } else {
        animatedProgress.current.setValue(1)
        resolve()
      }
    })
  }

  const { text, shouldBlur, buttonStyle, icon, onPress, shouldShowHomeOverlay } = useStudyState({
    plan,
    progress,
    blockIndex,
    group,
    triggerFinishStudyAnimation,
    remindDaily,
  })
  useEffect(() => {
    // Handle to show Remind Streak MODAL
    if (streakRemindShowed.current || !group) return
    if (plan && plan.status !== 'ended') {
      const startDate = getDateFromFirestoreTime(plan.startDate)
      const checkPeriod = getPeriodNumber(startDate, plan.pace)

      if (checkPeriod > plan.blocks.length) {
        const endCurrentGroup = async () => {
          endedPlan.current = true
          showLoading()
          await Firestore.Study.endGroupStudy(group.id, plan.id)
          hideLoading()
        }

        if (!endedPlan.current) endCurrentGroup()
      }
      if (
        checkPeriod <= blockIndex && // Have active study plan
        onPress && // Button open study plan is enabled
        !(plan.blocks[blockIndex - 1].completedMembers || []).includes(me.uid) && // User not finish current plan
        currentScreen === 'HomeTab' && // Stay in Home Tab
        (me.currentStreak || 0) > 0 && // Last streak must greater than 0 (To be save)
        !isStreakAdded() && // Streak is not added
        shouldShowHomeOverlay === false
      ) {
        NavigationRoot.navigate(Constants.SCENES.MODAL.SAVE_STREAK, { onStartStudyPlan: onPress })
        streakRemindShowed.current = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, progress, blockIndex, me.uid, me.currentStreak, onPress, group])

  return (
    // @ts-ignore
    <StudyBackground isFinishedStudy={isFinishedStudy} showGiving={showGiving}>
      <Title align="center" style={styles.welcome} numberOfLines={1}>
        {I18n.t('text.welcome_back', { nameValue: me.name })}
      </Title>

      <View
        style={landscape ? styles.landspaceButtonWrapper : styles.mainButtonWrapper}
        onLayout={e => {
          setButtonY(e.nativeEvent.layout.y)
        }}>
        <TouchableOpacity
          onPress={onPress}
          style={[
            styles.studyButton,
            buttonStyle === HomeButtonStyle.BLUE
              ? {
                  backgroundColor: color.primary,
                }
              : // eslint-disable-next-line react-native/no-inline-styles
                {
                  borderWidth: 2,
                  borderColor: color.whiteSmoke,
                  backgroundColor: color.transparent,
                },
            // eslint-disable-next-line react-native/no-inline-styles
            {
              opacity: shouldBlur ? 0.5 : 1,
            },
          ]}
          disabled={!onPress || loading}
          activeOpacity={0.8}
          delayPressIn={0.1}
          hitSlop={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          {icon && (
            <Animated.Image
              source={icon}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                width: 20,
                height: 20,
                marginRight: 10,
                marginLeft: 20,
                opacity: animatedProgress.current.interpolate({
                  inputRange: [0, 0.1],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateX: animatedProgress.current.interpolate({
                      inputRange: [0, 0.1],
                      outputRange: [20, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    scale: animatedProgress.current.interpolate({
                      inputRange: [0, 0.3, 0.5, 0.8, 0.9, 1],
                      outputRange: [1, 1, 1.5, 1.5, 1, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            />
          )}
          <Animated.Text
            style={[
              styles.centerText,
              Platform.OS === 'ios' && styles.studyButtonText,
              {
                color: color.lightTextSecondary,
                fontSize: typography.h2,
              },
              icon
                ? // eslint-disable-next-line react-native/no-inline-styles
                  {
                    marginRight: 20,
                    transform: [
                      {
                        translateX: animatedProgress.current.interpolate({
                          inputRange: [0, 0.1],
                          outputRange: [-20, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  }
                : null,
            ]}>
            {text}
          </Animated.Text>
        </TouchableOpacity>
      </View>

      <StartStudyHint buttonText={text} buttonPosY={buttonY} isStarted={shouldShowHomeOverlay && isHomeScreenFocus} onPress={onPress} />
    </StudyBackground>
  )
}

const { width: WINDOW_WIDTH } = Dimensions.get('window')
const styles = StyleSheet.create({
  welcome: {
    paddingHorizontal: 20,
    textAlign: 'center',
    color: 'white',
  },
  infoWrapper: {
    width: WINDOW_WIDTH - 26,
    alignSelf: 'center',
    flex: 1,
  },
  flex0: {
    flex: 0,
  },
  gradientView: {
    height: 294,
  },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  mainButtonWrapper: {
    marginTop: 22,
    width: Metrics.screen.width - 32,
  },
  landspaceButtonWrapper: { width: Metrics.screen.height / 2 - 40, marginTop: 22 },
  studyButton: {
    height: 55,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: Metrics.insets.horizontal,
  },
  studyButtonText: {
    fontWeight: 'bold',
  },
  centerText: { textAlign: 'center' },
  linear: {
    flex: 1,
    alignSelf: 'center',
    margin: 3,
    borderRadius: 16,
  },
})

export default StudySection
