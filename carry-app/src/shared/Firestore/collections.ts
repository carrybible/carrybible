export default {
  // Root collections
  USERS: 'users',
  GROUPS: 'groups',
  INVITES: 'invites',
  TRANSLATIONS: 'translations',
  ORGANISATIONS: 'organisations',
  CODES: 'codes',
  SMART_PLANS: 'smartPlans',
  SETTINGS: 'settings',
  CHECKOUTS: 'checkouts',
  FEEDBACKS: 'feedbacks',
  BUGS: 'bugs',

  // [1st level] Sub collections of GROUPS
  ACTIVITIES: 'activities',
  PLANS: 'plans',
  THREADS: 'threads',
  DRAFTS: 'drafts',
  ACTIONS: 'actions',
  RESPONSES: 'responses',
  SCORE: 'score',
  ACTION_STEPS: 'actionSteps',

  // [2nd level] Sub collections of THREADS
  UNREAD_THREADS: 'unreadThreads',

  // [2nd level] Sub collections of PLANS
  PROGRESS: 'progress',

  // [2nd level] Sub collections of ACTION_STEPS
  FOLLOW_UPS: 'followUps',
  UNREAD_COUNT: 'unreadCount',

  // [1st level] Sub collections of ORGANISATIONS
  SHARED_PLANS: 'sharedPlans',
  ORG_PLANS: 'orgPlans',
  ORG_MEMBERS: 'members',
  CAMPUSES: 'campuses',
  CAMPAIGNS: 'campaigns',
  DONATES: 'dontates',
  // [1st level] Sub param of SETTINGS
  POPULATED_PROMPT: 'populatedPrompt',
  // [2nd level] Sub collections of POPULATED_PROMPT
  POPULATED_PRAYER: 'prayer',
  POPULATED_GRATITUDE: 'gratitude',
}

/*
Below is the hierarchy of all collections
  users
    plans
    notes
    campaigns
  groups
    activities
    plans
      progress
    threads
    drafts
    actions
    responses
    score
      dailyLog

  invites

  translations
 */
