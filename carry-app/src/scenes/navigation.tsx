import AttachmentPickerSelectButton from '@components/AttachmentPickerSelectButton'
import BottomActions from '@components/BottomActions'
import BottomConfirm from '@components/BottomConfirm'
import DLHandler from '@components/DLHandler'
import DonateModal from '@components/DonateModal'
import GroupSlider from '@components/GroupSlider'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import MemberActivityPrompt from '@components/MemberActivityPrompt'
import SaveStreakModal from '@components/SaveStreakModal'
import ShareGroupModal from '@components/ShareGroupModal'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackNavigationOptions, TransitionPresets } from '@react-navigation/stack'
import * as Auth from '@scenes/Auth'
import * as Common from '@scenes/Common'
import * as FBZ from '@scenes/ForbiddenZone'
import * as Giving from '@scenes/Giving'
import * as GroupActions from '@scenes/GroupActions'
import * as GroupCreation from '@scenes/GroupCreation'
import * as Group from '@scenes/GroupHome'
import * as Launch from '@scenes/Launch'
import * as Onboarding from '@scenes/Onboarding'
import { navigationRef } from '@scenes/root'
import * as StudyAchievement from '@scenes/Study/Achievement'
import * as StudyCreation from '@scenes/Study/Creation'
import * as Study from '@scenes/Study/Main'
import { Config, Constants, StreamIO } from '@shared/index'
import { StripeProvider } from '@stripe/stripe-react-native'
import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Host } from 'react-native-portalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { OverlayProvider } from 'stream-chat-react-native'
import WelcomeGroup from './GroupHome/components/WelcomeGroup'

const SCENES = Constants.SCENES
const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const FULL_MODAL_OPTIONS = {
  ...TransitionPresets.ModalSlideFromBottomIOS,
}

const IOS_TRANSITION_OPTIONS = {
  ...TransitionPresets.SlideFromRightIOS,
}

const FADE_TRANSITION_OPTIONS = {
  ...TransitionPresets.ModalFadeTransition,
}

const MODAL_OPTIONS: StackNavigationOptions = {
  animationEnabled: false,
  cardOverlayEnabled: true,
  cardStyle: { backgroundColor: 'transparent' },
  presentation: 'transparentModal',
  cardStyleInterpolator: ({ current: { progress } }) => ({
    cardStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 0.5, 0.9, 1],
        outputRange: [0, 0.25, 0.7, 1],
      }),
    },
    overlayStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.0],
        extrapolate: 'clamp',
      }),
    },
  }),
}

const GroupHome = () => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const directMessageBadgeCount = React.useMemo(() => {
    return Object.values(group.unreadDirectMessage?.[group.id] ?? {}).reduce((acc, count) => acc + count, 0)
  }, [group])

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: color.background, borderTopColor: `${color.gray3}50` },
        tabBarActiveTintColor: color.accent2,
        tabBarInactiveTintColor: color.gray5,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}>
      <Tab.Screen
        name={SCENES.GROUP_HOME_TABS.HOME}
        component={Group.HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon source={require('@assets/icons/ic_home.png')} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        key={group.id}
        name={SCENES.GROUP_HOME_TABS.STUDY_PLAN}
        component={Group.StudyPlanScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon source={require('@assets/icons/ic_journal.png')} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={SCENES.GROUP_HOME_TABS.GROUP_CHAT}
        component={Group.GroupChatScreen}
        options={{
          tabBarBadge: group.unreadGroupMessage > 0 ? group.unreadGroupMessage : undefined,
          tabBarBadgeStyle: { backgroundColor: color.accent, color: color.white, transform: [{ scale: 0.8 }] },
          tabBarIcon: ({ color, size }) => <Icon source={require('@assets/icons/ic_discussion.png')} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={SCENES.GROUP_HOME_TABS.DIRECT_MESSAGE}
        component={Group.DirectMessageScreen}
        options={{
          tabBarBadge: directMessageBadgeCount > 0 ? directMessageBadgeCount : undefined,
          tabBarBadgeStyle: { backgroundColor: color.accent, color: color.white, transform: [{ scale: 0.8 }] },
          tabBarIcon: ({ color, size }) => <Icon source={require('@assets/icons/ic_direct_message.png')} color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

const Drawer = createDrawerNavigator()
const DrawerGroupHome: React.FC = () => {
  const { color } = useTheme()
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '80%',
          backgroundColor: color.background,
        },
        swipeEnabled: false,
      }}
      drawerContent={props => {
        return <GroupSlider {...props} />
      }}>
      <Drawer.Screen name="GroupHomeTab" component={GroupHome} />
    </Drawer.Navigator>
  )
}

const Navigation = props => {
  const { loading, loadingMessage } = useSelector<RootState, RootState['screen']>(state => state.screen)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { color } = useTheme()
  const { bottom, top } = useSafeAreaInsets()

  return (
    <Host>
      <StripeProvider
        publishableKey={Config.STRIPE.KEY}
        urlScheme={Config.STRIPE.URL} // required for 3D Secure and bank redirects
        merchantIdentifier={Config.BUNDLE_ID.IOS} // required for Apple Pay
        stripeAccountId={group.org?.giving?.stripeAccount?.id}>
        <NavigationContainer {...props} ref={navigationRef}>
          <OverlayProvider
            bottomInset={bottom}
            topInset={top}
            value={{ style: color.chat }}
            i18nInstance={StreamIO.streamI18n}
            // @ts-ignore
            AttachmentPickerSelectButton={AttachmentPickerSelectButton}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                ...TransitionPresets.FadeFromBottomAndroid,
              }}>
              {/*----------Launch screens----------*/}
              <Stack.Screen name={SCENES.LAUNCH.SPLASH} component={Launch.SplashScreen} />
              <Stack.Screen
                name={SCENES.LAUNCH.BIBLE_GROUPS}
                component={Launch.BibleGroupsScreen}
                options={({ navigation }) => {
                  const routes = navigation.getState().routes
                  if (routes.length > 1) {
                    return IOS_TRANSITION_OPTIONS
                  }
                  return FULL_MODAL_OPTIONS
                }}
              />
              {/*----------Auth screen----------*/}
              <Stack.Screen name={SCENES.AUTH.ENTER_YOUR_EMAIL} component={Auth.EnterEmailScreen} />
              <Stack.Screen name={SCENES.AUTH.CHECK_YOUR_INBOX} component={Auth.CheckYourInboxScreen} />
              <Stack.Screen name={SCENES.AUTH.RESEND_EMAIL_MODAL} component={Auth.ResendEmailModal} options={MODAL_OPTIONS} />

              {/*----------Home screen----------*/}
              <Stack.Screen name={SCENES.GROUP_HOME} component={DrawerGroupHome} />

              {/*----------Common----------*/}
              <Stack.Screen name={SCENES.COMMON.CONNECT_WITH_ORG} component={Common.ConnectOrgScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.COMMON.UPDATE_PROFILE} component={Onboarding.UpdateProfile} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.COMMON.TRANSLATION} component={Onboarding.Translation} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.COMMON.LANGUAGE} component={Common.Language} options={IOS_TRANSITION_OPTIONS} />

              {/*----------Group screens----------*/}
              <Stack.Screen name={SCENES.GROUP.REMINDER} component={Group.ReminderScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.CREATE} component={GroupCreation.CreateGroupScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen
                name={SCENES.GROUP.SELECT_CAMPUS}
                component={GroupCreation.SelectCampusScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen name={SCENES.GROUP.SHARE} component={Common.ShareGroupScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.THREAD} component={Group.ThreadScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.DISCUSS_THREAD} component={Group.DiscussThreadScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.SETTINGS} component={Group.GroupSettingScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.GIVING_CAMPAIGNS} component={Group.GivingCampaignsScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.GROUP.GIVING_PREVIEW} component={Group.GivingPreviewScreen} options={IOS_TRANSITION_OPTIONS} />

              {/*----------Giving----------*/}
              <Stack.Screen name={SCENES.GIVING.SETTINGS} component={Giving.GivingSettingScreen} />
              <Stack.Screen name={SCENES.GIVING.CARD_LIST} component={Giving.CardListScreen} />

              {/*----------Group actions screens----------*/}
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.DISCUSSIONS}
                component={GroupActions.DiscussionScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.DISCUSSIONS_BY_PLAN}
                component={GroupActions.PlanDiscussionScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.LISTING}
                component={GroupActions.GroupActionsListingScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.DETAIL}
                component={GroupActions.GroupActionsDetailScreen}
                options={FULL_MODAL_OPTIONS}
              />
              <Stack.Screen name={SCENES.GROUP_ACTIONS.CREATE} component={GroupActions.NewGroupActionScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.WEEKLY_REVIEW}
                component={GroupActions.WeeklyReviewScreen}
                options={FULL_MODAL_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.ACTION_STEPS}
                component={GroupActions.ActionStepsScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.FOLLOW_UP_LISTING}
                component={GroupActions.FollowUpListing}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.CREATE_FOLLOW_UP}
                component={GroupActions.CreateFollowUpScreen}
                options={FULL_MODAL_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.GROUP_ACTIONS.FOLLOW_UP_ACTIVITY}
                component={GroupActions.FollowUpActivity}
                options={FULL_MODAL_OPTIONS}
              />

              {/*----------Onboarding screens----------*/}
              <Stack.Screen name={SCENES.ONBOARDING.START_SCREEN} component={Onboarding.StartScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen
                name={SCENES.ONBOARDING.INFORMATION}
                component={Onboarding.OnboardingInformationScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.ONBOARDING.JOIN_A_GROUP}
                component={Onboarding.JoinAGroupScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.ONBOARDING.ADD_NOTIFICATION}
                component={Onboarding.AddNotificationScreen}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen name={SCENES.ONBOARDING.QUESTIONS} component={Onboarding.QuestionsScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen
                name={SCENES.ONBOARDING.ACCEPT_INVITE_GROUP}
                component={Onboarding.AcceptInviteGroup}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.ONBOARDING.ACCEPT_INVITE_ORGANISATION}
                component={Onboarding.AcceptInviteOrganisation}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen name={SCENES.ONBOARDING.LOGIN} component={Onboarding.OnboardingLoginScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.ONBOARDING.VIDEO} component={Onboarding.OnboardingVideo} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.SMP_QUESTIONS}
                component={StudyCreation.SmartPlanQuestions}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.SMP_BUILDING}
                component={StudyCreation.SmartPlanBuilding}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.SMP_START_DATE}
                component={StudyCreation.SmartPlanStartDate}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.SMP_CONFIRM}
                component={StudyCreation.SmartPlanConfirm}
                options={IOS_TRANSITION_OPTIONS}
              />

              {/*----------Study plan screens----------*/}
              <Stack.Screen name={SCENES.STUDY_PLAN.PREVIEW} component={Study.StudyGoalPreview} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ACTIVITIES}
                component={Study.StudyActivityScreen}
                options={(fromRoute: any): any => {
                  if (fromRoute.route.params?.useFadeTransition) return FADE_TRANSITION_OPTIONS
                  return FULL_MODAL_OPTIONS
                }}
              />
              <Stack.Screen name={SCENES.STUDY_PLAN.DAY_INTRO} component={Study.DayIntro} options={FADE_TRANSITION_OPTIONS} />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.PICK_STUDY}
                component={StudyCreation.PickStudyScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.QUICK_STUDY_BOOK}
                component={StudyCreation.QuickStudyBook}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.QUICK_STUDY_SETTING}
                component={StudyCreation.QuickStudySetting}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_LISTING}
                component={StudyCreation.AdvancedStudyListingScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.RECOMMENDED_STUDY}
                component={StudyCreation.RecommendedStudy}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_MAIN_BUILDER}
                component={StudyCreation.AdvancedStudyMainBuilderScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_SELECTION_MODAL}
                component={StudyCreation.AdvancedStudyActivitySelectionModal}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_CREATION_MODAL}
                component={StudyCreation.AdvancedStudyActivityCreationModal}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_BUILDER}
                component={StudyCreation.AdvancedStudyBuilder}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_CHOOSE_START_DATE}
                component={StudyCreation.AdvancedStudyChooseStartDateScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.ADVANCED_STUDY_PUBLISH}
                component={StudyCreation.AdvancedStudyPublishingScreen}
                options={IOS_TRANSITION_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.WEEKLY_COMPLETED}
                component={StudyAchievement.WeeklyCompletedScreen}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.STUDY_COMPLETED}
                component={StudyAchievement.StudyCompletedScreen}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen name={SCENES.STUDY_PLAN.STREAK_ACHIEVED} component={StudyAchievement.StreakScreen} options={MODAL_OPTIONS} />
              <Stack.Screen
                name={SCENES.STUDY_PLAN.CURRENT_GOAL_COMPLETED}
                component={StudyAchievement.BlockCompletedScreen}
                options={MODAL_OPTIONS}
              />
              <Stack.Screen name={SCENES.STUDY_PLAN.REMIND_NEXT_STUDY} component={Study.RemindNextPlan} options={MODAL_OPTIONS} />

              {/*----------Modal screens----------*/}
              <Stack.Screen name={SCENES.MODAL.DONATE} component={DonateModal} options={MODAL_OPTIONS} />

              <Stack.Screen name={SCENES.MODAL.BOTTOM_ACTIONS} component={BottomActions} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.SHARE_GROUP} component={ShareGroupModal} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.PICKER_IMAGE} component={Common.ImagePicker} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.FOOTNOTE} component={Common.Footnote} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.BOTTOM_CONFIRM} component={BottomConfirm} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.REPORT} component={Common.ReportModal} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.INVITATION} component={Common.AcceptInvitation} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.ACTION_STEP_CREATION} component={Common.ActionStepCreationModal} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.WELCOME} component={WelcomeGroup} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.SAVE_STREAK} component={SaveStreakModal} options={MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.MODAL.MEMBER_ACTIVITY_PROMPT} component={MemberActivityPrompt} options={MODAL_OPTIONS} />

              {/*----------Message screens----------*/}
              <Stack.Screen name={SCENES.PRIVATE_CHAT} component={Common.PrivateChat} />
              <Stack.Screen name={SCENES.NEW_MESSAGE} component={Group.NewDirectMessageScreen} />

              {/*----------Other screens----------*/}
              <Stack.Screen name={SCENES.ACCOUNT_SETTINGS} component={Common.AccountSettingScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.LEADER_TOOLS} component={Common.LeaderToolsScreen} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.JOIN_GROUP} component={Common.JoinGroup} options={IOS_TRANSITION_OPTIONS} />
              <Stack.Screen name={SCENES.LEADER_PROMPTS} component={Common.LeaderPromptScreen} options={FULL_MODAL_OPTIONS} />
              <Stack.Screen name={SCENES.SCAN_QR_CODE} component={Common.ScanQRCode} options={FULL_MODAL_OPTIONS} />

              {/*----------ForbiddenZone screens----------*/}
              {global.IS_INTERNAL && (
                <Stack.Screen name={SCENES.FORBIDDEN_ZONE.HOME} component={FBZ.ForbiddenZoneHomeScreen} options={IOS_TRANSITION_OPTIONS} />
              )}
            </Stack.Navigator>
          </OverlayProvider>

          <DLHandler />
        </NavigationContainer>
        {loading && (
          <View style={[StyleSheet.absoluteFill, s.loadingContainer]}>
            <Loading style={s.loadingMsg} message={loadingMessage} />
          </View>
        )}
      </StripeProvider>
    </Host>
  )
}

const s = StyleSheet.create({
  loadingContainer: { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loadingMsg: { flex: 0, minHeight: 100, minWidth: 100, borderRadius: 20 },
})

export default Navigation
