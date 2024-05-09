import Avatar from '@components/Avatar'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import StreakIcon from '@components/StreakIcon'
import { RootState } from '@dts/state'
import useActionStepFeature from '@hooks/useActionStepFeature'
import useInitStudyPlanData from '@hooks/useInitStudyPlanData'
import useLoading from '@hooks/useLoading'
import { ScreenView } from '@hooks/useScreenMode'
import useSetupGroupData from '@hooks/useSetupGroupData'
import useUpdateBadgeCount from '@hooks/useUpdateBadgeCount'
import { DrawerScreenProps } from '@react-navigation/drawer'
import { useIsFocused } from '@react-navigation/native'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore, LocalStorage, Reminder } from '@shared/index'
import Utils from '@shared/Utils'
import { isAfter } from 'date-fns'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AfterStudyHint from '../components/Hints/AfterStudyHint'
import MenuHint from '../components/Hints/MenuHint'
// import GivingBanner from './GivingBanner'
import GivingPrompt from './GivingPrompt'
import GroupPrompt from './GroupPrompt'
import HomeActionButton from './HomeActionButton'
import StudySection from './StudySection'

type ParamProps = {
  fromInvitation: boolean
  groupId?: string
  remindDaily: boolean
}
type Props = DrawerScreenProps<{ HomeScreen: ParamProps }, 'HomeScreen'>

const HomeScreen: React.FC<Props> = props => {
  const { navigation } = props
  const {
    route: { params },
  } = props
  const dispatch = useDispatch()
  const initGroupId = params?.groupId
  const fromInvitation = params?.fromInvitation
  const remindDaily = params?.remindDaily
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const organisation = useSelector<RootState, RootState['organisation']>(state => state.organisation)
  const { activeCampaigns } = organisation
  const loading = !group.id
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { showLoading, hideLoading } = useLoading()
  const { blockIndex, progress } = useInitStudyPlanData()
  const showGiving = !!activeCampaigns.length && group.org?.giving?.allowSetup && group.org?.giving?.isConnected
  const isFinishedStudy = progress?.[blockIndex]?.isCompleted
  const hasActionStepFeature = useActionStepFeature()
  const isFocus = useIsFocused()
  const [actionButtonsY, setActionButtonsY] = useState(0)
  const [isFinishedStudyInAtLeastOneGroup, setIsFinishedStudyInAtLeastOneGroup] = useState(() => {
    return !!isFinishedStudy
  })
  const shouldShowConnectionView =
    !me.phoneNumber && group.org && group.org?.isRequirePhone && !(me.disabledRequirePhone || []).includes(group.org.id)
  const showAsList = showGiving || shouldShowConnectionView

  useEffect(() => {
    if (group.id) Firestore.Group.triggerAddActivePlan(group.id, showLoading, hideLoading)
  }, [group.id])

  useEffect(() => {
    if (group.id && group.organisation) {
      dispatch({ type: TYPES.ORGANISATION.GET_CAMPAIGNS, payload: { organisation: group.organisation, groupId: group.id } })
    }
  }, [dispatch, group.id, group.organisation])

  useEffect(() => {
    if (initGroupId) {
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: initGroupId })
    }
  }, [dispatch, initGroupId])

  useEffect(() => {
    if (fromInvitation) {
      NavigationRoot.navigate(Constants.SCENES.MODAL.WELCOME)
    }
    navigation.setParams({ fromInvitation: false })
  }, [fromInvitation])

  useEffect(() => {
    if (group.isOwner && group.activeGoal) {
      const planRef = Firestore.Study.planCollectionref(group.id)
      Utils.checkScheduleFuturePlan(planRef, group)
    }
  }, [group.activeGoal, group.isOwner, group])

  useEffect(() => {
    LocalStorage.getReminderTime().then(reminderTime => {
      if (!reminderTime) {
        return
      }

      if (isAfter(Date.now(), reminderTime)) {
        Reminder.scheduleReminder(reminderTime, { name: me.name })
      }
    })
  }, [])

  useEffect(() => {
    const run = async () => {
      if (isFinishedStudy) {
        setIsFinishedStudyInAtLeastOneGroup(true)
        return
      }
      const result = await Firestore.Study.checkCompletedStudyInAllGroups(ids, true)
      setIsFinishedStudyInAtLeastOneGroup(result)
    }
    if (group.channel?.id === group.id) {
      run()
    }
  }, [ids, isFinishedStudy, group.id, group.channel?.id])

  useSetupGroupData()
  useUpdateBadgeCount()

  const onHomeActionButtonsLayout = e => setActionButtonsY(e.nativeEvent.layout.y)
  return (
    <Container safe={true} style={styles.container} forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        title={I18n.t('text.Home')}
        iconLeft={
          <View>
            <Avatar url={group?.image} size={40} pressable={false} style={styles.avatar} />
          </View>
        }
        onPressLeft={() => navigation.openDrawer()}
        RightComponent={<StreakIcon count={me.currentStreak ?? 0} isCompleteTodayStudy={isFinishedStudyInAtLeastOneGroup} />}
      />
      <ScreenView
        scrollable={{ view: showAsList, left: showAsList, right: showAsList }}
        containerProps={!showAsList && { style: { flex: 1, justifyContent: 'space-between' } }}
        onExpandListLayout={onHomeActionButtonsLayout}>
        {!showAsList ? <View /> : null}
        {/* TODO: Enable when the non-profit entity takes over https://github.com/carrybible/carry-issues/issues/582 */}
        {/* {Config.VARIANT === 'carry' ? <GivingBanner blockIndex={blockIndex} isFinishedStudy={isFinishedStudy} /> : null} */}
        <StudySection loading={loading} remindDaily={remindDaily} showGiving={showAsList} />
        <View>
          <ScrollView
            horizontal
            contentContainerStyle={styles.groupActionsWrapper}
            pointerEvents={loading ? 'none' : 'auto'}
            showsHorizontalScrollIndicator={false}>
            {hasActionStepFeature && (
              <HomeActionButton
                icon="🙌"
                text={I18n.t('text.Action steps')}
                badgeNumber={group.groupActions?.prayer.unreadCount || 0}
                onPress={() => {
                  NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.ACTION_STEPS)
                }}
              />
            )}
            <HomeActionButton
              icon="🙏"
              text={I18n.t('text.PRAYER')}
              badgeNumber={group.groupActions?.prayer.unreadCount || 0}
              onPress={() => {
                NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.LISTING, {
                  type: 'prayer',
                })
              }}
            />
            <HomeActionButton
              icon="🎉"
              text={I18n.t('text.GRATITUDE')}
              badgeNumber={group.groupActions?.gratitude.unreadCount || 0}
              onPress={() => {
                NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.LISTING, {
                  type: 'gratitude',
                })
              }}
            />
            <HomeActionButton
              icon="💬"
              text={I18n.t('text.DISCUSSION')}
              badgeNumber={group.discussionCount || 0}
              onPress={() => {
                NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.DISCUSSIONS)
              }}
            />
            {group.org?.giving?.allowSetup && group.org?.giving?.isConnected && (
              <HomeActionButton
                icon="🤝"
                text={I18n.t('text.GIVING')}
                onPress={() => {
                  NavigationRoot.push(Constants.SCENES.GROUP.GIVING_CAMPAIGNS)
                }}
              />
            )}
          </ScrollView>
        </View>
        <GroupPrompt isFinishedStudy={isFinishedStudy} />
        {showGiving && activeCampaigns[0] ? <GivingPrompt campaign={activeCampaigns[0]} /> : null}
      </ScreenView>
      <AfterStudyHint isShowGiving={showGiving} buttonPosY={actionButtonsY} isFocus={isFocus} isFinishedStudy={isFinishedStudy} />
      <MenuHint buttonPosY={actionButtonsY} isFocus={isFocus} onPress={() => navigation.openDrawer()} />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  groupActionsWrapper: {
    paddingHorizontal: 16,
    height: 132,
  },
  avatar: {
    marginRight: 15,
  },
})

export default HomeScreen
