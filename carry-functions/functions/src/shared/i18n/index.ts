import I18n from 'i18n-js'

import en from './en.json'
import es from './es.json'
import da from './da.json'
import de from './de.json'
import fr from './fr.json'
import he from './he.json'
import id from './id.json'
import it from './it.json'
import nl from './nl.json'
import pt from './pt.json'
import ru from './ru.json'
import sv from './sv.json'
import uk from './uk.json'
import vi from './vi.json'

const translations = {
  en,
  es,
  da,
  de,
  fr,
  he,
  id,
  it,
  nl,
  pt,
  ru,
  sv,
  uk,
  vi,
}

const init = () => {
  I18n.fallbacks = true
  I18n.defaultLocale = 'en'
  I18n.missingBehaviour = 'guess'
  I18n.translations = translations
}

export const trans = (lang: string, key?: string, options?: any) => {
  if (!key) return ''
  I18n.locale = lang
  const lastOptions: any = {}
  if (options?.pure) {
    return key
  }
  if (options) {
    for (const property in options) {
      if (options[property].key) {
        const current = options[property] as TransString
        lastOptions[property] = trans(lang, current.key, current.options)
      } else {
        lastOptions[property] = options[property]
      }
    }
  }
  return I18n.t(key, lastOptions) || ''
}

export type TransString = {
  key?: string
  options?: any
}

export const genTran: (key?: string, options?: any) => TransString = (key?: string, options?: any) => {
  const result: { key?: string; options?: any } = {}
  if (key) result.key = key
  if (options) result.options = options
  return result
}

export default init
