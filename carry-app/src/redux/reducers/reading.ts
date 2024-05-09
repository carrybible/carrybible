import db from '@shared/Database'
import { TYPES } from '../actions'

const INITIAL_STATE = {
  translation: undefined,
}

export default function bibleReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.TRANSLATIONS.VERSION.UPDATE:
      db.reading = {
        ...state,
        translation: payload,
      }
      return {
        ...state,
        translation: payload,
      }
    default:
      return state
  }
}
