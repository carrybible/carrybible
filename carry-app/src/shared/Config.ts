import { NativeModules } from 'react-native'

const CarryConfig = NativeModules.CarryConfig.getConstants() as {
  application: {
    env: 'dev' | 'prod'
    name: string
    variant: 'carry'
    bundleId: {
      ios: string
      android: string
    }
    contactUrl: string
  }
  branchIO: {
    domains: string[]
    uriScheme: string
    testMode: boolean
    key: {
      live: string
      test: string
    }
  }
  codepush: { android: string; ios: string }
  segment: { key: string }
  bibleApi: { key: string; server: string; fumsServer: string }
  streamIO: { key: string; server: string }
  stripe: {
    merchant: string
  }
}

devLog('CarryConfig: ', CarryConfig)

const FEATURES_GATE = {
  SUPPORTED_LANGUAGES:
    CarryConfig.application.env === 'dev'
      ? ['en', 'es', 'de', 'fr', 'nl', 'da', 'it', 'pt', 'id', 'ru', 'sv', 'uk', 'he', 'vi']
      : ['en', 'es'],
  BIBLE_API_ENABLED: true,
  // https://www.notion.so/Bible-Translations-6cc51ac7e91348ed933002dc90d72ebe
  BIBLE_WHITELIST: {
    en: ['ESV', 'KJV', 'NIV', 'ASV'],
    es: ['RVR09', 'BES'],
    de: ['ELBBK', 'L1912'],
    fr: [],
    nl: ['NLD1939'],
    da: [],
    it: [],
    pt: ['BLT'],
    id: ['TSI'],
    ru: [],
    sv: ['SKB'],
    uk: ['BHNY'],
    he: ['HDZP'],
    vi: ['OVCB', 'VIE1934'],
  },
}

const GIVE_URL = 'https://www.carrybible.com/give'

export default {
  ENV: CarryConfig.application.env,
  VARIANT: CarryConfig.application.variant,
  APP_NAME: CarryConfig.application.name,
  CONTACT_URL: CarryConfig.application.contactUrl,
  BUNDLE_ID: {
    IOS: CarryConfig.application.bundleId.ios,
    ANDROID: CarryConfig.application.bundleId.android,
  },
  SEGMENT: {
    KEY: CarryConfig.segment.key,
  },
  BRANCH: {
    DOMAIN: CarryConfig.branchIO.domains,
  },
  STREAMIO: {
    KEY: CarryConfig.streamIO.key,
    SERVER: CarryConfig.streamIO.server,
  },
  CODEPUSH: {
    IOS: CarryConfig.codepush.ios,
    ANDROID: CarryConfig.codepush.android,
  },
  BIBLE_API: {
    KEY: CarryConfig.bibleApi.key,
    SERVER: CarryConfig.bibleApi.server,
    FUMS_SERVER: CarryConfig.bibleApi.fumsServer,
  },
  FEATURES_GATE,
  SERVER: CarryConfig.application.env === 'dev' ? '' : '',
  STRIPE:
    CarryConfig.application.env === 'dev'
      ? {
          KEY: '',
          URL: '',
          MERCHANT: CarryConfig.stripe.merchant,
        }
      : {
          KEY: '',
          URL: '',
          MERCHANT: CarryConfig.stripe.merchant,
        },
  GIVE_URL,
  DASHBOARD_URL: CarryConfig.application.env === 'dev' ? '' : '',
}
