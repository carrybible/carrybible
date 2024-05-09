import ConfirmDialog from '@components/ConfirmDialog'
import Container from '@components/Container'
import NavigationGuidance from '@components/NavigationGuidance'
import TransparentNavigation from '@components/TransparentNavigation'
import { GroupActionsType } from '@dts/groupAction'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import FollowUpHighlightAction from '@scenes/GroupActions/components/Activities/FollowUpHighlightAction'
import { useAnalytic } from '@shared/Analytics'
import Constants, { DEFAULT_PROMPTS } from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Reminder from '@shared/Reminder'
import Utils, { getDateFromFirestoreTime, wait } from '@shared/Utils'
import { differenceInDays } from 'date-fns'
import isAfter from 'date-fns/isAfter'
import isEqual from 'date-fns/isEqual'
import I18n from 'i18n-js'
import React, { createContext, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import useStreak from '../Achievement/hooks/useStreak'
import { ActivityVideo } from './components/Activities'
import ActivityAction from './components/Activities/ActivityAction'
import ActivityActStepIntro from './components/Activities/ActivityActStepIntro'
import ActivityCompleted from './components/Activities/ActivityCompleted'
import ActivityGivingCampaign from './components/Activities/ActivityGivingCampaign'
import ActivityQuestion from './components/Activities/ActivityQuestion'
import ActivityReading from './components/Activities/ActivityReading'
import ActivityStreak from './components/Activities/ActivityStreak'
import ActivityText from './components/Activities/ActivityText'
import ReadingProgress from './components/ReadingProgress'

// eslint-disable-next-line no-unused-vars
const NAVIGATION_WIDTH: { [studyType in StudyPlan.Activity['type']]: { left: number; right: number } } = {
  text: { left: 50, right: 64 },
  action: { left: 32, right: 50 },
  passage: { left: 50, right: 64 },
  question: { left: 32, right: 32 },
  video: { left: 32, right: 32 },
  completed: { left: 32, right: 32 },
  streak: { left: 32, right: 32 },
  actStep: { left: 32, right: 32 },
  actStepHighlight: { left: 32, right: 32 },
  campaign: { left: 32, right: 32 },
}

const ActionTypeScoreMapping = {
  text: ScoreDailyActionType.READ_TEXT,
  passage: ScoreDailyActionType.READ_PASSAGE,
  video: ScoreDailyActionType.WATCH_VIDEO,
}

type Props = any

const MAXIMUM_ACTIONS = 2

const StudyActivityScreen: FC<Props> = props => {
  const dispatch = useDispatch()
  const { slowSpring } = useLayoutAnimation()
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { showLoading, hideLoading } = useLoading()
  const { color } = useTheme()
  const Analytics = useAnalytic()
  const confirmBackRef = useRef<{ open: () => void }>()
  const {
    plan,
    block,
    blockIndex,
    progress,
    isRedo,
  }: {
    plan: StudyPlan.GroupPlan
    block: StudyPlan.Block
    blockIndex: number
    progress: StudyPlan.UserProgress
    isRedo: boolean
  } = props.route.params
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)
  const activeCampaigns = useSelector<RootState, RootState['organisation']['activeCampaigns']>(state => state.organisation.activeCampaigns)
  const prompts = useSelector<RootState, RootState['settings']['populatedPrompt']>(state => state.settings.populatedPrompt)
  const userCampaign = useSelector<RootState, RootState['organisation']['userCampaign']>(state => state.organisation.userCampaign)
  const activeActionStep = useSelector<RootState, RootState['actionSteps']['activeActionStep']>(state => state.actionSteps.activeActionStep)
  const dailyFlowFollowUp = useSelector<RootState, RootState['actionSteps']['dailyFlowFollowUp']>(
    state => state.actionSteps.dailyFlowFollowUp,
  )

  const firstCampaign = useMemo(() => {
    return activeCampaigns?.[0]
  }, [activeCampaigns])

  const { isStreakAdded } = useStreak()
  const [step, setStep] = useState(0)
  const realIndex = useRef(0)
  const [shouldHideVideo, setShouldHideVideo] = useState(false)
  const readingTime = useRef({
    startTime: 0,
    endTime: 0,
    duration: 0,
  })

  const popScreen = () => {
    setStep(-1)
    const timeout = setTimeout(() => {
      navigation.pop()
      clearTimeout(timeout)
    }, 200)
  }

  const [activities] = useState<(StudyPlan.Activity & StudyPlan.CustomIndex)[]>(() => {
    const acts: (StudyPlan.Activity & StudyPlan.CustomIndex)[] = []
    const customPassages: StudyPlan.CustomPassage[] = []
    let isActionTypeExisted = false
    let realIndex = 0

    const getRealIndex = () => {
      realIndex += 1
      return { realIndex }
    }

    if (firstCampaign && userCampaign?.showedStudy?.planId !== plan.id) {
      acts.push({
        type: 'campaign',
        campaign: firstCampaign,
      })
    }

    block?.activities?.forEach((value: StudyPlan.Activity & StudyPlan.CustomIndex) => {
      if (value.type === 'passage') {
        if ((value.verses?.length || 0) > 0) {
          value.verses?.forEach((verse, verseIndex) => {
            acts.push({
              ...value,
              verses: [verse],
              ...getRealIndex(),
            })
            customPassages.push({
              bookId: value.chapter?.bookId || 0,
              chapterId: value.chapter?.chapterNumber || 0,
              fromVerse: verse.from,
              toVerse: verse.to,
            })
          })
        } else {
          acts.push({ ...value, ...getRealIndex() })
          customPassages.push({
            bookId: value.chapter?.bookId || 0,
            chapterId: value.chapter?.chapterNumber || 0,
            toChapterId: value.chapter?.toChapterNumber,
          })
        }
      } else if (value.type === 'question') {
        acts.push({ customPassages, ...value, ...getRealIndex() })
      } else if (value.type === 'video') {
        acts.push({ ...(value as StudyPlan.VideoAct), ...getRealIndex() })
      } else if (value.type === 'text') {
        acts.push({ ...(value as StudyPlan.TextAct), ...getRealIndex() })
      } else if (value.type === 'action') {
        isActionTypeExisted = true
        const act = value as StudyPlan.ActionAct
        acts.push({ ...act, ...getRealIndex() })
        const actions = group.groupActions?.[act.actionType as GroupActionsType].data || []
        if (actions.length > 0) {
          let count = 0
          actions.forEach(action => {
            if (!action.viewerIds.includes(me.uid) && count < MAXIMUM_ACTIONS) {
              count += 1
              acts.push({
                ...act,
                action,
              })
            }
          })
        }
      }
    })

    const returnActs: (StudyPlan.Activity & StudyPlan.CustomIndex)[] = []

    const actStepActs: (StudyPlan.Activity & StudyPlan.CustomIndex)[] = []

    if (group.hasActionStepFeature && activeActionStep) {
      if (!activeActionStep.completedMembers.includes(me.uid)) {
        actStepActs.push({
          type: 'actStep',
          actionStep: activeActionStep,
        })
      }
      if (dailyFlowFollowUp) {
        actStepActs.push(
          {
            type: 'actStepHighlight',
            followUp: dailyFlowFollowUp,
            actionStepId: activeActionStep.id,
            messageId: dailyFlowFollowUp.id,
          },
          {
            type: 'question',
            messageId: dailyFlowFollowUp.id,
            question: I18n.t(`Encourage action step`),
            possessiveName: Utils.possessive(dailyFlowFollowUp.creatorInfo?.name),
          },
        )
      }
    }

    if (!isActionTypeExisted && !group.disabledAutoAction && !isRedo) {
      const randomPrompt = Utils.getRandomValueByChange(prompts?.prayer?.length > 0 ? prompts.prayer : DEFAULT_PROMPTS.prayer)
      const groupActionsActs: (StudyPlan.Activity & StudyPlan.CustomIndex)[] =
        group.groupActions.prayer.createdCount === 0 && group.groupActions.gratitude.createdCount === 0
          ? [
              {
                type: 'action',
                actionType: 'prayer',
                text: randomPrompt.text,
                requestText: randomPrompt.requestText,
              },
            ]
          : []

      let count = 0

      const addActionOfMemberToStack = (actions, type: 'prayer' | 'gratitude') => {
        actions.forEach(action => {
          if (!action.viewerIds.includes(me.uid) && count < MAXIMUM_ACTIONS) {
            count += 1
            groupActionsActs.push({
              type: 'action',
              actionType: type,
              action,
            })
          }
        })
      }

      const actionsPrayer = group.groupActions.prayer.data || []
      const actionsGratitude = group.groupActions.gratitude?.data || []

      addActionOfMemberToStack(actionsPrayer, 'prayer')
      addActionOfMemberToStack(actionsGratitude, 'gratitude')

      returnActs.push(...groupActionsActs)
    }

    returnActs.push(...acts, ...actStepActs)

    if (!isRedo) {
      returnActs.push({
        type: 'completed',
        pace: 'day',
      })

      if (!isStreakAdded()) {
        returnActs.push({
          type: 'streak',
        })
      }
    }

    const currentRealStep = returnActs.findIndex(value => value.realIndex === progress?.currentStep)
    if (progress && currentRealStep !== -1 && !progress.isCompleted && !isRedo) {
      if (currentRealStep + 1 < returnActs.length) {
        slowSpring()
        setStep(currentRealStep + 1)
      } else {
        slowSpring()
        setStep(currentRealStep)
      }
    }

    return returnActs
  })

  const [currentActivity, setCurrentActivity] = useState<StudyPlan.Activity>()
  const [showNextPlanReminder] = useState(false)

  useEffect(() => {
    setCurrentActivity(activities[step])
    if (activities[step]?.type === 'actStep') {
      Analytics.event(Constants.EVENTS.ACTIONS_STEP.VIEW_INTRO_OR_PROMPT)
    }
    if (activities[step]?.type === 'actStepHighlight') {
      Analytics.event(Constants.EVENTS.ACTIONS_STEP.VIEW_FOLLOW_UP_HIGHLIGHT)
    }
  }, [activities, step])

  const checkNextPlanReminder = async () => {
    const endDate = getDateFromFirestoreTime(group.activeGoal?.endDate)
    const currentDate = new Date()
    const distance = differenceInDays(endDate, currentDate)
    const planRef = Firestore.Study.planCollectionref(group.id)
    const planDocs = (await planRef?.get())?.docs.map(i => i.data())
    const hasFuturePlans = planDocs?.some(i => {
      return (
        i.id !== group.activeGoal?.id &&
        (isAfter(getDateFromFirestoreTime(group.activeGoal?.endDate), getDateFromFirestoreTime(i.startDate)) ||
          isEqual(getDateFromFirestoreTime(group.activeGoal?.endDate), getDateFromFirestoreTime(i.startDate)))
      )
    })

    const showReminder = distance <= 2 && !hasFuturePlans && group.isOwner
    if (showReminder) navigation.push(Constants.SCENES.STUDY_PLAN.REMIND_NEXT_STUDY)
    return showReminder
  }

  const onPressClose = useCallback(async () => {
    Analytics.event(Constants.EVENTS.GOAL.EXITED_DOING_A_GOAL)
    if (realIndex.current !== 0 && !isRedo) {
      showLoading(I18n.t('text.Saving your process'))
      const result = await Firestore.Study.updateGroupStudyProgress(
        plan.targetGroupId || '',
        plan.id,
        blockIndex,
        realIndex.current,
        currentActivity?.type === 'passage' ? readingTime.current.duration : undefined,
      )
      hideLoading()
      if (result) {
        popScreen()
      } else {
        confirmBackRef.current?.open()
      }
      return
    }

    if (currentActivity?.type === 'video') {
      setStep(step => step - 1)
    }
    popScreen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, progress, navigation])

  const onPressMarkAsRead = async (onlyMarkAsRead?: boolean) => {
    // onPress might receive some other params, need to compare with exactly value
    // Check to increase realIndex
    if ((activities?.[step]?.realIndex || 0) > realIndex.current) {
      realIndex.current = activities?.[step]?.realIndex || 0
      devLog('increase realIndex.current', realIndex.current, block?.activities?.length)
    }

    Analytics.event(Constants.EVENTS.GOAL.MARKED_A_READING_AS_READ)

    if (currentActivity?.type && ['video', 'text', 'passage'].includes(currentActivity.type)) {
      Firestore.Group.updateScore(ActionTypeScoreMapping[currentActivity.type], group.id)
    }

    if (currentActivity?.type === 'actStepHighlight') {
      dispatch({
        type: TYPES.FOLLOW_UPS.MARK_AS_READ,
        payload: {
          groupId: group.id,
          actionStepsId: currentActivity.actionStepId,
          followUpId: currentActivity.followUp.id,
        },
      })
    }

    if (step < activities.length - 1) {
      // If not the last step
      // If block not completed, update Streak and Progress of User
      if (!progress?.isCompleted) {
        Firestore.Study.updateGroupStudyProgress(
          plan.targetGroupId || '',
          plan.id,
          blockIndex,
          realIndex.current,
          currentActivity?.type === 'passage' ? readingTime.current.duration : undefined,
        )
      }
      // In crease step
      if (onlyMarkAsRead !== true) {
        slowSpring()
        setStep(val => val + 1)
      }
    } else {
      global.JUST_COMPLETED_DAILY_FLOW = true

      if ((progress?.currentStep || 0) < step + 1 && !progress?.isCompleted) {
        showLoading()
        // New logic not update streak until finish daily, pace now only have 'day'
        const result = await Firestore.Study.updateGroupStudyProgress(
          plan.targetGroupId || '',
          plan.id,
          blockIndex,
          realIndex.current,
          currentActivity?.type === 'passage' ? readingTime.current.duration : undefined,
        )
        if (result) {
          const latestBlockIndex = Utils.getBlockIndexOfPlan(plan)
          // Check if user are doing previous daily flow
          if (blockIndex < latestBlockIndex.blockIndex) {
            Firestore.Group.updateScore(ScoreDailyActionType.COMPLETE_PREV_DAILY_FLOW, group.id)
          } else {
            await Firestore.Group.updateScore(ScoreDailyActionType.COMPLETE_CURRENT_DAILY_FLOW, group.id)
          }
          if (onlyMarkAsRead !== true) {
            await moveToGoalComplete()
            checkNextPlanReminder()
          }
          // Cancel today reminder if user already finished their daily flow in every group they're in
          Firestore.Study.checkCompletedStudyInAllGroups(ids).then(finishedDailyInAllGroups => {
            if (finishedDailyInAllGroups) {
              Reminder.cancelTodayScheduleReminder()
            }
          })
        } else {
          hideLoading()
          toast.error(I18n.t('error.Unable to save your process'))
        }
      } else {
        if (onlyMarkAsRead !== true) {
          popScreen()
          checkNextPlanReminder()
        }
      }
    }
  }

  async function moveToGoalComplete() {
    // Get newest plan after update user progress
    await Firestore.Study.getPlanData(plan.targetGroupId || '', plan.id)
    hideLoading()
    popScreen()
    Analytics.event(Constants.EVENTS.GOAL.COMPLETED_A_DAILY_GOAL)
  }

  async function onShowCampaign() {
    dispatch({
      type: TYPES.ORGANISATION.UPDATE,
      payload: {
        userCampaign: {
          showedStudy: { planId: plan.id, blockIndex },
        },
      },
    })
    Firestore.User.updateUserCampaign({ blockIndex, planId: plan.id, campaignId: activeCampaigns[0].id })
  }

  const ContentView = useMemo(() => {
    if (!currentActivity) return null
    switch (currentActivity.type) {
      case 'video':
        return <ActivityVideo key={step} onWatched={onPressMarkAsRead} video={currentActivity} shouldHideVideo={shouldHideVideo} />
      case 'passage':
        readingTime.current.startTime = new Date().getTime()
        return (
          <ActivityReading
            key={step}
            onReadDone={() => {
              readingTime.current.endTime = new Date().getTime()
              readingTime.current.duration = readingTime.current.endTime - readingTime.current.startTime
              onPressMarkAsRead()
            }}
            passage={currentActivity}
          />
        )
      case 'question':
        return <ActivityQuestion key={step} activity={currentActivity} onPressNext={onPressMarkAsRead} />
      case 'text':
        return <ActivityText key={step} activity={currentActivity} onPressNext={onPressMarkAsRead} />
      case 'action':
        return <ActivityAction key={step} activity={currentActivity} onShare={onPressMarkAsRead} groupId={plan?.targetGroupId} />
      case 'completed':
        return <ActivityCompleted key={step} onPress={onPressMarkAsRead} groupId={plan.targetGroupId} />
      case 'streak':
        return <ActivityStreak key={step} plan={plan} onPress={onPressMarkAsRead} />
      case 'actStep':
        return <ActivityActStepIntro key={step} activity={currentActivity} onPress={onPressMarkAsRead} />
      case 'actStepHighlight':
        return (
          <FollowUpHighlightAction
            key={step}
            info={{
              messageId: currentActivity.messageId,
              question: currentActivity.question || I18n.t('text.Check out how name params took action this week'),
              content: currentActivity.followUp.content,
              // @ts-ignore
              creatorInfo: currentActivity.followUp.creatorInfo,
            }}
            onContinue={onPressMarkAsRead}
          />
        )
      case 'campaign':
        return <ActivityGivingCampaign campaign={firstCampaign} onShowCampaign={onShowCampaign} onPressNext={onPressMarkAsRead} />
      // Use newest campaign data (which is updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActivity, shouldHideVideo])

  const onPressPrevious = async () => {
    if (step > 0) {
      // Prevent crashing on Android when unmount and mount the
      // Video component too fast (press back and forward immediately)
      if (Platform.OS === 'android' && currentActivity?.type === 'video' && currentActivity.service === 'web') {
        setShouldHideVideo(true)
        await wait(200)
      }
      slowSpring()
      setStep(step - 1)
      if (shouldHideVideo) {
        setShouldHideVideo(false)
      }
    }
  }

  return (
    <ActivityContext.Provider value={{ activities, step, plan }}>
      <Container
        safe={true}
        forceInset={{ bottom: true, top: true }}
        backgroundColor={color.id === 'light' ? '#fafafa' : color.background}
        style={s.container}>
        <ReadingProgress
          stepCount={activities.length}
          currentStep={step + 1}
          isShowAnswer={false}
          onClosePress={onPressClose}
          hideProgressBar={showNextPlanReminder}
        />
        {currentActivity?.type && !showNextPlanReminder && (
          <View style={s.flex}>
            {ContentView}
            <TransparentNavigation mode="left" width={NAVIGATION_WIDTH[currentActivity.type].left} onPress={onPressPrevious} />
            <TransparentNavigation mode="right" width={NAVIGATION_WIDTH[currentActivity.type].right} onPress={onPressMarkAsRead} />
          </View>
        )}

        <NavigationGuidance />
        <ConfirmDialog
          // @ts-ignore
          ref={confirmBackRef}
          title={I18n.t('text.Confirm')}
          message={I18n.t('text.Unable to save your process. Do you want to back')}
          onOkPress={() => {
            popScreen()
          }}
        />
      </Container>
    </ActivityContext.Provider>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    // paddingBottom: 25,
  },
})

export const ActivityContext = createContext<{
  activities: StudyPlan.Activity[]
  step: number
  plan?: StudyPlan.GroupPlan
}>({
  activities: [],
  step: 0,
})

export default StudyActivityScreen
