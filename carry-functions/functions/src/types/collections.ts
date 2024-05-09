export default {
  // Root collections
  USERS: 'users',
  GROUPS: 'groups',
  IAP: 'iap',
  INVITES: 'invites',
  TRANSLATIONS: 'translations',
  ORGANISATIONS: 'organisations',
  CODES: 'codes',
  SMART_PLANS: 'smartPlans',
  SETTINGS: 'settings',
  STRIPE: 'stripe',
  VIDEOS: 'videos',
  GLIDE_USERS: 'glideUsers',
  SYSTEM_SETTINGS: 'systemSettings',
  CHECKOUTS: 'checkouts',

  // Sub collections of systemSettings/givingFee
  CUSTOM_FEE: 'customFee',

  // [1st level] Sub collections of GROUPS
  ACTIVITIES: 'activities',
  PLANS: 'plans',
  ORG_PLANS: 'orgPlans',
  THREADS: 'threads',
  GOALS: 'goals',
  DRAFTS: 'drafts',
  ACTIONS: 'actions',
  RESPONSES: 'responses',
  SCORE: 'score',
  ACTION_STEPS: 'actionSteps',

  // [2nd level] Sub collections of SCORE
  DAILY_LOG: 'dailyLog',

  // [2nd level] Sub collections of PLANS
  PROGRESS: 'progress',

  // [2nd level] Sub collections of GOALS
  PERIODS: 'periods',
  HISTORIES: 'histories',

  // [2nd level] Sub collections of ACTION_STEPS
  FOLLOW_UPS: 'followUps',
  UNREAD_COUNT: 'unreadCount',

  // [1st level] Sub collections of USERS
  NOTES: 'notes',

  // [1st level] Sub collections of ORGANISATIONS
  SHARED_PLANS: 'sharedPlans',
  SOCIAL_POSTS: 'socialPosts',
  CAMPUS: 'campuses',
  TRACKING: 'tracking',
  CAMPAIGN: 'campaigns',
  DONATES: 'donates',
  FUND: 'funds',
  MEMBERS: 'members',
  DONATE_PRODUCTS: 'donateProducts',

  // [1st level] Sub param of SETTINGS
  POPULATED_PROMPT: 'populatedPrompt',
  // [2nd level] Sub collections of POPULATED_PROMPT
  POPULATED_PRAYER: 'prayer',
  POPULATED_GRATITUDE: 'gratitude',
  EMAIL_INVITES: 'emailInvites',
}

/*
Below is the hierarchy of all collections
  users
    plans
    notes

  groups
    activities
    plans
      progress
    threads
    goals
      periods
      histories
    drafts
    actions
    responses
    score
      dailyLog

  iap

  invites

  translations
 */
