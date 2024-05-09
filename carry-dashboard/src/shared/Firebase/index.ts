import Config from '@shared/Config'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import {
  fetchAndActivate,
  getRemoteConfig,
  isSupported as isRemoteConfigSupported,
  RemoteConfig,
} from 'firebase/remote-config'
import { getStorage } from 'firebase/storage'

const firebaseConfig =
  Config.ENV === 'dev'
    ? {
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
      }
    : {
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
      }
const app = initializeApp(firebaseConfig)

const Firebase = {
  auth: getAuth(app),
  firestore: getFirestore(app),
  functions: getFunctions(app),
  storage: getStorage(app),
  remoteConfig: {} as RemoteConfig,
  collections: {
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

    // [1st level] Sub collections of GROUPS
    ACTIVITIES: 'activities',
    PLANS: 'plans',
    THREADS: 'threads',
    GOALS: 'goals',
    DRAFTS: 'drafts',
    ACTIONS: 'actions',
    RESPONSES: 'responses',
    SCORE: 'score',
    ACTION_STEPS: 'actionSteps',
    GROUP_VIDEOS: 'videos',

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
    ORG_PLANS: 'orgPlans',
    MEMBERS: 'members',
    // [2nd level] Sub collections of SHARED_PLANS
    PUBLISHED_GROUPS: 'publishedGroups',

    // [1st level] Sub param of SETTINGS
    POPULATED_PROMPT: 'populatedPrompt',
    CURRENCIES: 'currencies',
    // [2nd level] Sub collections of POPULATED_PROMPT
    POPULATED_PRAYER: 'prayer',
    POPULATED_GRATITUDE: 'gratitude',
    CAMPUS: 'campuses',

    FUND: 'funds',
  },
}

const initializeRemoteConfig = async () => {
  const supported = await isRemoteConfigSupported()
  if (!supported) {
    return
  }

  Firebase.remoteConfig = getRemoteConfig(app)
  // On dev env, we will fetch remote config for each second
  // On other env, we will fetch remote config for each hour
  Firebase.remoteConfig.settings.minimumFetchIntervalMillis =
    Config.ENV === 'dev' ? 1000 : 3600000

  Firebase.remoteConfig.defaultConfig = {
    invitation_link: JSON.stringify({
      preview_title: 'Tap here to join my group!',
      preview_text:
        'Join my group on Carry so we can draw closer to God and build a Bible habit together 🙏',
      preview_image:
        'https://storage.googleapis.com/carry-live.appspot.com/app/invite-preview.png',
      sharing_text:
        "Hey! We're trying out this app called Carry to draw closer to God and build a Bible habit together. Do you want to join my group? 😊. Join my group at {{url}} or use this code {{code}} in the app!",
    }),
  }

  await fetchAndActivate(Firebase.remoteConfig)
}

export const reInitFirebaseFunctionAfterLogin = async () => {
  Firebase.functions = getFunctions(app)
  Firebase.firestore = getFirestore(app)
  Firebase.storage = getStorage(app)
  initializeRemoteConfig()
}

initializeRemoteConfig()

export default Firebase
