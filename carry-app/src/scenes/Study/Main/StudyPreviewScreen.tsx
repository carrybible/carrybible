import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
// import GroupActions from '@dts/groupAction'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLoading from '@hooks/useLoading'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import { Metrics, StreamIO } from '@shared/index'
import Utils, { checkShowedDayIntro, getDateFromFirestoreTime } from '@shared/Utils'
import { add, compareDesc, differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import React, { createContext, FC, useEffect, useMemo, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { useSelector } from 'react-redux'
import StudyPreviewHeader from './components/StudyPreviewHeader'
import StudyPreviewMembers from './components/StudyPreviewMembers'
import StudyPreviewPlan from './components/StudyPreviewPlan'
import StudyPreviewProgress from './components/StudyPreviewProgress'

export const StudyPreviewContext = createContext<{
  loading?: boolean
  groupId?: string
  plan?: StudyPlan.GroupPlan
  blockIndex: number
  completedMembers?: string[]
  progress?: { [bIndex: string]: StudyPlan.UserProgress }
  groupMembers?: any
  channel?: any
  inOnboardingFlow?: boolean
  showIntro?: boolean
  initTab?: number
  planStatus?: string
  isFuturePlan?: boolean
}>({ blockIndex: 0 })

const Tab = createMaterialTopTabNavigator()

const StudyPreviewScreen: FC<any> = props => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { groupId, planId, inOnboardingFlow, isFuturePlan } = props.route.params
  const me = useSelector<any, App.User>(s => s.me)
  const [plan, setPlan] = useState<StudyPlan.GroupPlan>()
  const [blockIndex, setBlockIndex] = useState<number>(0) // Start from 1
  const [completedMembers, setCompletedMembers] = useState<string[]>([])
  const [groupMembers, setGroupMembers] = useState<any>()
  const [channel, setChannel] = useState<any>()
  const [progress, setProgress] = useState<{ [bIndex: string]: StudyPlan.UserProgress }>()
  // const [actions, setActions] = useState<{ [key: string]: GroupActions[] }>({})
  const dim = useWindowDimensions()
  const { color } = useTheme()
  const { showLoading, hideLoading } = useLoading()
  const { landscape } = useScreenMode()

  const planStatus = useMemo(() => {
    if (!plan) return 'ended'
    if (plan.status === 'ended') return 'ended'
    const startDate = getDateFromFirestoreTime(plan.startDate)
    const endAt = add(startDate, { [`${plan.pace}s`]: plan.duration })
    const currentDay = new Date()
    const isIntime = compareDesc(startDate, currentDay) >= 0 && compareDesc(currentDay, endAt) >= 0
    if (!isIntime || group.activeGoal?.id !== planId) return 'ended'
    return 'normal'
  }, [plan, group])

  // Get Group Channel
  useEffect(() => {
    const c = StreamIO.client.channel('messaging', groupId)
    setChannel(c)
    setGroupMembers(c?.state?.members ? Object.values(c?.state?.members) : [])
  }, [groupId])

  // Sync active goal
  useEffect(() => {
    if (!groupId || !planId) return
    const ref = Firestore.Group.planRef(groupId, planId)
    const unsubscribe = ref?.onSnapshot(snap => {
      if (snap) {
        const planData: any = snap.data()
        if (planData) {
          const currentBlock = Utils.getBlockIndexOfPlan(planData)
          setBlockIndex(currentBlock.blockIndex)
          setPlan(planData)
        }
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId, planId])

  // Sync Progress
  useEffect(() => {
    if (!me.uid || !groupId || !planId || !blockIndex) return
    const ref = Firestore.Study.getUserProgressRef(me.uid, groupId, planId)
    const unsubscribe = ref?.onSnapshot(snap => {
      if (snap) {
        const progressData = {}
        snap.docs.forEach(snapItem => {
          const item = snapItem.data() as StudyPlan.UserProgress
          progressData[`${item.blockIndex}`] = item
        })
        setProgress(progressData)
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId, planId, me.uid, blockIndex])

  // Get members
  useEffect(() => {
    if (!plan || !plan.memberProgress) return
    const members = Object.keys(plan.memberProgress)
    const memberDone = members.filter(uid => plan?.memberProgress[uid]?.isCompleted)
    setCompletedMembers(memberDone)
  }, [plan?.memberProgress])

  const BottomView = useMemo(() => {
    if (!plan) return null
    if (plan.status === 'ended') return null // Ended will hide bottom button
    const startDate = getDateFromFirestoreTime(plan.startDate)
    const endAt = add(startDate, { [`${plan.pace}s`]: plan.duration })
    const currentDay = new Date()
    const isIntime = compareDesc(startDate, currentDay) >= 0 && compareDesc(currentDay, endAt) >= 0

    if (!isIntime || group.activeGoal?.id !== planId) return null

    if (blockIndex === 0) {
      // Not start yet
      const currentBlockIndex = differenceInDays(getDateFromFirestoreTime(plan.startDate), Date.now()) + 1
      return (
        <BottomButton
          title={
            currentBlockIndex > 1 ? I18n.t('text.Starting in s', { currentBlockIndex }) : I18n.t('text.Starting in', { currentBlockIndex })
          }
          rounded
          disabled
        />
      )
    }
    if (progress?.[blockIndex]?.isCompleted) {
      // Done task
      return (
        <BottomButton
          title={I18n.t('text.Back to group')}
          rounded
          onPress={() => {
            NavigationRoot.pop(1)
          }}
        />
      )
    }

    return (
      <BottomButton
        title={
          progress?.[blockIndex]
            ? I18n.t('text.Continue goal')
            : I18n.t('text.Start reading', {
                value: `${plan.pace.charAt(0).toUpperCase() + plan.pace.slice(1)} ${blockIndex}`,
              })
        }
        rounded
        onPress={async () => {
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
        }}
        style={{
          backgroundColor: color.accent,
        }}
      />
    )
  }, [plan, progress, inOnboardingFlow, blockIndex])

  return (
    <StudyPreviewContext.Provider
      value={{ groupId, plan, blockIndex, completedMembers, progress, groupMembers, channel, planStatus, isFuturePlan }}>
      <Container safe>
        <ScreenView separateHorizontal>
          <View style={{}}>
            <StudyPreviewHeader />
            <StudyPreviewProgress />
          </View>
          <Tab.Navigator
            sceneContainerStyle={{ backgroundColor: color.background }}
            screenOptions={{
              tabBarShowLabel: true,
              tabBarInactiveTintColor: color.gray4,
              tabBarActiveTintColor: color.text,
              tabBarIndicatorStyle: [
                {
                  borderTopLeftRadius: 100,
                  borderTopRightRadius: 100,
                  height: 3,
                  backgroundColor: color.text,
                  width: dim.width * 0.5 - 80,
                  marginLeft: 40,
                },
                landscape
                  ? { width: Metrics.screen.height / 8, marginLeft: Metrics.screen.height / 16 }
                  : { width: Metrics.screen.width / 4, marginLeft: Metrics.screen.width / 8 },
              ],
              tabBarStyle: { backgroundColor: color.background },
              tabBarLabelStyle: { fontWeight: '700' },
            }}
            initialRouteName="Plan">
            <Tab.Screen
              name="Plan"
              options={{
                tabBarLabel: I18n.t('text.Plan'),
              }}
              component={StudyPreviewPlan}
            />
            <Tab.Screen
              name="Members"
              options={{
                tabBarLabel: I18n.t('text.Members'),
              }}
              component={StudyPreviewMembers}
            />
          </Tab.Navigator>
          {BottomView}
        </ScreenView>
      </Container>
    </StudyPreviewContext.Provider>
  )
}

export default StudyPreviewScreen
