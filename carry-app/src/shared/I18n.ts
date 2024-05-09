import translations from '@assets/i18n'
import Config from '@shared/Config'
import { enUS, es } from 'date-fns/locale'
import I18n from 'i18n-js'
import { I18nManager } from 'react-native'
import * as RNLocalize from 'react-native-localize'

// For StreamIO day time format localize
import 'dayjs/locale/da'
import 'dayjs/locale/de'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/he'
import 'dayjs/locale/id'
import 'dayjs/locale/it'
import 'dayjs/locale/nl'
import 'dayjs/locale/pt'
import 'dayjs/locale/ru'
import 'dayjs/locale/sv'
import 'dayjs/locale/uk'
import 'dayjs/locale/vi'

const locales = { enUS, es }

export const forceChangeLanguage = locale => {
  I18n.reset()
  I18n.fallbacks = true
  I18n.defaultLocale = 'en'
  I18n.missingBehaviour = 'guess'
  I18n.translations = translations
  I18n.locale = locale
  global.languageTag = locale
  global.locale = locales[locale] || enUS
}

// fallback if no available language fits
const fallback = { languageTag: 'en', isRTL: false }
const { languageTag, isRTL } = RNLocalize.findBestAvailableLanguage(Object.keys(translations)) || fallback
I18nManager.forceRTL(isRTL)
// set i18n-js config
I18n.fallbacks = true
I18n.defaultLocale = 'en'
I18n.missingBehaviour = 'guess'
I18n.translations = translations
I18n.locale = languageTag
global.languageTag = languageTag
global.locale = locales[languageTag] || enUS
I18n.missingPlaceholder = placeholder => {
  if (placeholder === '{{org_name}}') {
    return Config.APP_NAME
  }
  return '[missing ' + placeholder + ' value]'
}

export default I18n
