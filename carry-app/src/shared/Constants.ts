import RNFS from '@carrybible/react-native-file-system'
import Config from '@shared/Config'

export default {
  NON_SPACE_CHARACTER: '\u200B',
  UNSPLASH: 'bd30102700b6b2e88272d38a6091da8eb856c23fe1c1bbbcbb6f598ec351a779',
  APOSTROPHE_CHAR: '’',
  IMAGES: {
    UNSPLASH: 'Unsplash',
    LIBRARY: 'Library',
  },
  DIR: {
    DOCUMENT: RNFS.Dir.Document,
    USFM: `${RNFS.Dir.Document}/usfm`,
    TRANSLATIONS: `${RNFS.Dir.Document}/translations`,
    INDEX: `${RNFS.Dir.Document}/index`,
  },
  EVENTS: {
    ADVANCED_GOAL: {
      MAKE_CUSTOM_STUDY: 'Make custom Study',
      CHOOSE_ADVANCED: 'Choose Advanced Study',
      CHOOSE_QUICK_START: 'Choose Quick Start Study',
      CHOOSE_DAILY: 'Choose Daily Study',
      CHOOSE_WEEKLY: 'Choose Weekly Study',
      VIEW_STUDY_BLOCK: 'View Study Block Screen',
      VIEW_STUDY_BUILDER: 'View Study Builder Screen',
      CREATE_NEW_STUDY_BLOCK: 'Create new study block',
      DELETE_STUDY: 'Delete Study',
      PUBLISH_STUDY: 'Publish Study',
      ADD_READING_ACT: 'Add reading activity',
      ADD_QUESTION_ACT: 'Add question activity',
      ADD_ACTION_PRAYER_ACT: 'Add prayer activity',
      ADD_ACTION_GRATITUDE_ACT: 'Add gratitude activity',
      ADD_TEXT_ACT: 'Add text activity',
      ADD_VIDEO_ACT: 'Add video activity',
      DELETE_STUDY_BLOCK: 'Delete Study Block',
      FINISH_FOR_NOW: 'Finish for now',
      WEEK_COMPLETED_SCREEN: 'Week Complete Screen',
      STUDY_COMPLEED_SCREEN: 'Study Complete Screen',
      ADD_PASSAGES_TO_CHAT: 'Add passage to chat',
    },
    NOTIFICATION: {
      TAP: 'Tapped on Notification',
      GRANTED: 'Enabled Notifications',
      DENIED: 'Denied Notifications',
      ALLOW: 'Allow Notifications',
      SKIP: 'Skip Notifications',
      DM: 'Tapped on direct message notification',
      THREAD: 'Tapped on thread message notification',
      GENERAL: 'Tapped on general chat message notification',
      COMPLETE_GOAL: 'Tapped on a completed goal notification',
      JOINED_GROUP: 'Tapped on a joined group notification',
      LEFT_GROUP: 'Tapped on a left group notification',
      MUTE_DM: 'Muted direct message notification',
      UNMUTE_DM: 'Unnuted direct message notification',
      MUTE_GROUP: 'Muted group notification',
      UNMUTE_GROUP: 'Unnuted group notification',
      GOAL_REMINDER: 'Tapped on daily goal reminder notification',
      NEW_ACTIONS: 'Member create new prompt',
    },
    ON_BOARDING: {
      REPLAYS_VIDEO: 'Replays a video',
      PICK_TRANSLATION: 'Picks a translation (Onboarding)',
      SKIPS_VIDEO: 'Skips video',
      JOIN_PUBLIC_CLUB: 'Joins a public group (Onboarding)',
      PICKS_DESCRIPTION: 'Picks a description (Onboarding)',
      PICKS_GOAL: 'Picks a goal (Onboarding)',
      ENABLE_NOTIFICATION: 'Enable Notification',
    },
    BIBLE_NOTE_TAPPED: 'Tapped on Bible Note Discovery',
    NOTES: {
      CREATED: 'Created Personal Note',
      EDITED: 'Edited Personal Note',
      DELETED: 'Deleted Personal Note',
    },
    MESSAGE_REPLIED: 'Replied to Thread',
    CHAT_REPLIED: 'Replied to General Chat',
    DM_REPLIED: 'Replied to Private Chat',
    GROUP: {
      CREATE_CANCELLED: 'Cancelled Group Creation',
      CREATE_SUCCESS: 'Created Group',
      CREATE_ENDED: 'Finished Group Creation',
      INVITED: 'Shared Group Dynamic Link',
      GOAL_CANCELLED: 'Cancelled Create Group Goal',
      CREATE_GOAL_SUCCESS: 'Created group goal',
      TAPPED_THREAD_ITEM: 'Tapped on a thread from group thread tab',
      TAPPED_THREAD_GOAL: 'Tapped on a goal thread from group thread tab',
      TABS: {
        GOAL: 'Navigated to group goal tab',
        MEMBERS: 'Navigated to group member tab',
        THREAD: 'Navigated to group thread tab',
      },
      PRAYER_REQUEST: 'Prayer request',
      PRAYER_RESPONSE: 'Prayer response',
      GRATITUDE_REQUEST: 'Gratitude request',
      GRATITUDE_RESPONSE: 'Gratitude response',
    },
    GOAL: {
      PREVIEWED_GOAL: 'Previewed goal',
      VIEW_ENDED_GOAL: 'View an ended goal',
      EXITED_DOING_A_GOAL: 'Exited doing a goal',
      COMPLETED_A_DAILY_GOAL: 'Completed a daily goal',
      MARKED_A_READING_AS_READ: 'Marked a reading as read',
      ANSWERED_A_QUESTION: 'Answered a question',
      STARTED_DOING_A_GOAL: 'Started doing a goal',
      ENDED_GOAL: 'Ended a goal',
      VIEWED_GOAL_COMPLETETION_SCREEN: 'Viewed Goal Complete Screen', // not added yet
      VIEWED_GOAL_STREAL_SCREEN: 'Viewed Goal Streal Screen', // not added yet
      EXITED_DOING_GOAL: 'Exited doing a goal',
      VIEWED_STUDY_PUBLISHING_SCREEN: 'Viewed Study Publishing Screen', // not added yet
      VIEWED_STUDY_COMPLETED_SCREEN: 'Viewed Study Completed Screen', // not added yet
      START_SMART_PLANNER: 'Start Smart Planner',
      COMPLETE_SMART_PLANNER: 'Complete Smart Planner',
    },
    HIGHLIGHT: {
      ACTIVE: 'Highlighted a Verse',
      CLEAR: 'Cleared highlight',
    },
    GROUP_PREVIEW: {
      TAPPED_NOTES_TAB: 'Tapped Notes tab',
      CHANGED_GOAL: 'Changed Goal',
      VIEW_ANOTHER_PROFILE: "View another user's profile",
    },
    REMINDER: {
      TAPPED_SET_REMINDER: 'Tapped Set Reminder',
      TAPPED_CANCEL: 'Tapped Cancel',
    },
    ACTIONS_STEP: {
      VIEW_INTRO_OR_PROMPT: 'View Action step intro / prompt',
      COMPLETE_IN_DAILY_FLOW: 'Complete Action step - in Daily flow',
      COMPLETE_IN_HOME_SCREEN: 'Complete Action step - on Home screen',
      SHARE_ACTION_STEP_FOLLOW_UP: 'Share action step follow-up',
      SKIP_ACTION_STEP_FOLLOW_UP: 'Skip action step follow-up',
      VIEW_FOLLOW_UP_HIGHLIGHT: 'View follow-up highlight',
      SHARE_MESSAGE_TO_FOLLOW_UP_HIGHLIGHT: 'Share message to follow-up highlight',
      VIEW_ALL_ACTION_STEPS: 'View all action steps',
      VIEW_ACTION_STEP_FOLLOW_UPS: 'View action step follow-ups',
    },
  },
  HIGHLIGHTS: {
    light: [
      { id: '#FFDEA1', color: '#FFDEA166', platte: '#FFCF77' },
      { id: '#EBBAFF', color: '#EBBAFF66', platte: '#DE8EFF' },
      { id: '#B4F1FF', color: '#B4F1FF66', platte: '#89E9FF' },
      { id: '#BAFFCA', color: '#BAFFCA66', platte: '#8EFFA8' },
      { id: '#F1FFBA', color: '#F1FFBA66', platte: '#E8FF8E' },
      { id: '#FFCFBA', color: '#FFCFBA66', platte: '#FFB08E' },
      { id: '#FFBABA', color: '#FFBABA66', platte: '#FF8E8E' },
    ],
    dark: [
      { id: '#FFDEA1', color: '#FFDEA144', platte: '#FFDEA1' },
      { id: '#EBBAFF', color: '#EBBAFF44', platte: '#EBBAFF' },
      { id: '#B4F1FF', color: '#B4F1FF44', platte: '#B4F1FF' },
      { id: '#BAFFCA', color: '#BAFFCA44', platte: '#BAFFCA' },
      { id: '#F1FFBA', color: '#F1FFBA44', platte: '#F1FFBA' },
      { id: '#FFCFBA', color: '#FFCFBA44', platte: '#FFCFBA' },
      { id: '#FFBABA', color: '#FFBABA44', platte: '#FFBABA' },
    ],
  },
  SCENES: {
    LAUNCH: {
      BIBLE_GROUPS: 'BibleGroups',
      SPLASH: 'Splash',
    },
    GIVING: {
      SETTINGS: 'GivingSettings',
      CARD_LIST: 'CreditCardList',
    },
    AUTH: {
      ENTER_YOUR_EMAIL: 'EnterYourEmail',
      CHECK_YOUR_INBOX: 'CheckYourInbox',
      RESEND_EMAIL_MODAL: 'ResendEmailModal',
    },
    GROUP_HOME: 'GroupHome',
    GROUP_HOME_TABS: {
      HOME: 'HomeTab',
      STUDY_PLAN: 'GroupStudyPlanTab',
      GROUP_CHAT: 'GroupChatTab',
      DIRECT_MESSAGE: 'DirectMessageTab',
    },
    GROUP: {
      SELECT_CAMPUS: 'SelectCampus',
      CREATE: 'GroupCreate',
      REMINDER: 'Reminder',
      SHARE: 'GroupShare',
      THREAD: 'GroupThread',
      DISCUSS_THREAD: 'DiscussThread',
      SETTINGS: 'GroupSettings',
      GIVING_CAMPAIGNS: 'GivingCampaignsScreen',
      GIVING_PREVIEW: 'GivingPreviewScreen',
    },
    COMMON: {
      CONNECT_WITH_ORG: 'ConnectWithOrg',
      UPDATE_PROFILE: 'UpdateProfile',
      TRANSLATION: 'Translation',
      LANGUAGE: 'Language',
    },
    GROUP_ACTIONS: {
      LISTING: 'GroupActions.Listing',
      DETAIL: 'GroupActions.Detail',
      DISCUSSIONS: 'GroupActions.Discussions',
      DISCUSSIONS_BY_PLAN: 'GroupActions.DiscussionsByPlan',
      CREATE: 'GroupActions.Create',
      WEEKLY_REVIEW: 'GroupActions.WeeklyReview',
      ACTION_STEPS: 'GroupActions.ActionSteps',
      FOLLOW_UP_LISTING: 'GroupActions.FollowUpListing',
      CREATE_FOLLOW_UP: 'GroupActions.CreateFollowUp',
      FOLLOW_UP_ACTIVITY: 'GroupActions.FollowUpActivity',
    },
    ONBOARDING: {
      START_SCREEN: 'Start',
      INFORMATION: 'OnboardingInformation',
      JOIN_A_GROUP: 'JoinAGroup',
      ADD_NOTIFICATION: 'AddNotification',
      QUESTIONS: 'Questions',
      INVITE_GROUP: 'OnboardingInviteGroup',
      ACCEPT_INVITE_GROUP: 'AcceptInviteGroup',
      ACCEPT_INVITE_ORGANISATION: 'AcceptInviteOrganisation',
      VIDEO: 'OnboardingVideo',
      LOGIN: 'OnboardingLogin',
    },
    STUDY_PLAN: {
      SET_STUDY_TYPE: 'SetStudyType',
      PICK_STUDY: 'Study.PickStudy',
      PICK_STUDY_SETTING: 'Study.PickStudy.Setting',
      QUICK_STUDY_BOOK: 'Study.QuickStudy.Book',
      QUICK_STUDY_SETTING: 'Study.QuickStudy.Setting',
      ADVANCED_STUDY_LISTING: 'Study.AdvancedGoal.Listing',
      ADVANCED_STUDY_MAIN_BUILDER: 'Study.AdvancedGoal.MainBuilder',
      ADVANCED_STUDY_ACTIVITY_SELECTION_MODAL: 'Study.AdvancedGoal.Builder.ActivitySelectionModal',
      ADVANCED_STUDY_ACTIVITY_CREATION_MODAL: 'Study.AdvancedGoal.Builder.ActivityCreationModal',
      ADVANCED_STUDY_BUILDER: 'Study.AdvancedGoal.Builder',
      ADVANCED_STUDY_CHOOSE_START_DATE: 'Study.AdvancedGoal.ChooseStartDate',
      ADVANCED_STUDY_PUBLISH: 'Study.AdvancedGoal.Publish',
      RECOMMENDED_STUDY: 'Study.RecommendedStudy',
      PREVIEW: 'Study.Preview',
      ACTIVITIES: 'Study.Activities',
      DAY_INTRO: 'Study.DayIntro',
      CURRENT_GOAL_COMPLETED: 'CurrentGoalCompleted',
      STREAK_ACHIEVED: 'StreakAchieved',
      WEEKLY_COMPLETED: 'WeeklyPlanCompleted',
      STUDY_COMPLETED: 'StudyPlanCompleted',
      SMP_QUESTIONS: 'SmartPlanQuestions',
      SMP_BUILDING: 'SmartPlanBuilding',
      SMP_CONFIRM: 'SmartPlanConfirm',
      SMP_START_DATE: 'SmartPlanStartDate',
      REMIND_NEXT_STUDY: 'RemindNextPlan',
    },
    MODAL: {
      BOTTOM_ACTIONS: 'BottomActions',
      PICKER_IMAGE: 'ImagePicker',
      BOTTOM_CONFIRM: 'BottomConfirm',
      INVITATION: 'InvitationModal',
      FOOTNOTE: 'Footnote',
      SHARE_GROUP: 'ShareGroup',
      WELCOME: 'Welcome',
      MEMBER_ACTIVITY_PROMPT: 'MemberActivityPrompt',
      SAVE_STREAK: 'SaveStreak',
      ACTION_STEP_CREATION: 'ActionStepCreation',
      DONATE: 'DonateModal',
      REPORT: 'ReportModal',
    },
    FORBIDDEN_ZONE: {
      HOME: 'ForbiddenZone.Home',
    },
    // message related screen
    PRIVATE_CHAT: 'PrivateChat',
    NEW_MESSAGE: 'NewMessage',
    GROUP_MEMBERS: 'GroupMembers',
    ACCOUNT_SETTINGS: 'AccountSettings',
    LEADER_TOOLS: 'LeaderTools',
    JOIN_GROUP: 'JoinGroup',
    LEADER_PROMPTS: 'LeaderPrompts',
    SCAN_QR_CODE: 'ScanQRCode',
  },
  REMINDER_NOTIFICATION_ID: 9989,
  FUTURE_PLANS_NOTIFICATON_ID: 9900,
  STREAK_NOTIFICATION_ID: 100,
  STREAK_WARNING_NOTIFICATION_ID: 101,
  REMINDER_DAILY_VERSE_ID: 200, // to 206, backup one week
  REMINDER_COMPELETE_WEEK_ADVANCED_DAY_3: 300,
  REMINDER_COMPELETE_WEEK_ADVANCED_DAY_5: 301,
  REMINDER_COMPELETE_WEEK_ADVANCED_DAY_6: 302,
  REMINDER_WEEKLY_REVIEW: 310,
  SMART_PLAN_QUESTION_KEYS: {
    PURPOSE: 'QUESTION_GROUP_PURPOSE',
    CONSTITUTION: 'QUESTION_GROUP_CONSTITUTION',
    TIME: 'QUESTION_GROUP_STUDY_TIME',
    START_DATE: 'START_DATE',
  },
  SMART_PLAN_ANSWERS_KEYS: {
    ANSWER_FORMAL_GROUP: 'ANSWER_FORMAL_GROUP',
    ANSWER_COLLEGE_CAMPUS: 'ANSWER_COLLEGE_CAMPUS',
    ANSWER_DEEPER_FRIENDS: 'ANSWER_DEEPER_FRIENDS',
    ANSWER_TRYING_OUT: 'ANSWER_TRYING_OUT',
    ANSWER_LONG_TERM: 'ANSWER_LONG_TERM',
    ANSWER_NEW_BELIEVERS: 'ANSWER_NEW_BELIEVERS',
    ANSWER_MIXED_GROUP: 'ANSWER_MIXED_GROUP',
    ANSWER_5_MINS: 'ANSWER_5_MINS',
    ANSWER_10_MINS: 'ANSWER_10_MINS',
    ANSWER_15_MINS: 'ANSWER_15_MINS',
    ANSWER_START_STUDY_TODAY: 'ANSWER_START_STUDY_TODAY',
    ANSWER_CHOOSE_A_FUTURE_DATE: 'ANSWER_CHOOSE_A_FUTURE_DATE',
  },
  PREVIEW_STATUS: {
    AVAILABLE: 'available',
    NORMAL: {
      ONGOING: 'ongoing',
      UPCOMING: 'upcoming',
    },
    ENDED: 'ended',
    FUTURE: 'future',
  },
}

export const DEFAULT_PROMPTS = {
  prayer: [
    {
      chance: 0.5,
      text: 'What do you need prayer for today?',
      requestText: 'Can you pray for {{name}} today?',
    },
    {
      chance: 0.25,
      text: 'Is there someone in your life the group can be praying for?',
      requestText: 'Can you pray with {{name}} for someone in their life today?',
    },
    {
      chance: 0.25,
      text: "Is there something going on in the world you'd like to pray for?",
      requestText: 'Can you pray with {{name}} today?',
    },
  ],
  gratitude: [],
}

export const DEFAULT_CONFIGS = {
  leader_prompts_days: '[2,4,5,6]',
  invitation_link: JSON.stringify({
    preview_title: 'Tap here to join my group!',
    preview_text: 'Join my group on Carry so we can draw closer to God and build a Bible habit together 🙏',
    preview_image: 'https://storage.googleapis.com/carry-live.appspot.com/app/invite-preview.png',
    sharing_text:
      "Hey! We're trying out this app called Carry to draw closer to God and build a Bible habit together. Do you want to join my group? 😊. Join my group at {{url}}",
  }),
}

export const LANGUAGES = {
  en: { name: 'English', details: '', value: 'en' },
  es: { name: 'Español', details: 'Spanish', value: 'es' },
  de: { name: 'Deutsch', details: 'German', value: 'de' },
  fr: { name: 'Français', details: 'French', value: 'fr' },
  nl: { name: 'Nederlands', details: 'Dutch', value: 'nl' },
  da: { name: 'Dansk', details: 'Danish', value: 'da' },
  it: { name: 'Italiano', details: 'Italian', value: 'it' },
  pt: { name: 'Português', details: 'Portuguese', value: 'pt' },
  id: { name: 'bahasa Indonesia', details: 'Indonesian', value: 'id' },
  ru: { name: 'Русский', details: 'Russian', value: 'ru' },
  sv: { name: 'svenska', details: 'Swedish', value: 'sv' },
  uk: { name: 'українська', details: 'Ukrainian', value: 'uk' },
  he: { name: 'עִברִית', details: 'Hebrew', value: 'he' },
  vi: { name: 'Tiếng Việt', details: 'Vietnamese', value: 'vi' },
}

export const SUPPORT_LANGUAGES = [
  LANGUAGES.en,
  LANGUAGES.es,
  LANGUAGES.de,
  LANGUAGES.fr,
  LANGUAGES.nl,
  LANGUAGES.da,
  LANGUAGES.it,
  LANGUAGES.pt,
  LANGUAGES.id,
  LANGUAGES.ru,
  LANGUAGES.sv,
  LANGUAGES.uk,
  LANGUAGES.he,
  LANGUAGES.vi,
].filter(lang => Config.FEATURES_GATE.SUPPORTED_LANGUAGES.includes(lang.value))

export const RolesCanCreateGroup = ['leader', 'campus-leader', 'campus-user', 'admin', 'owner']
