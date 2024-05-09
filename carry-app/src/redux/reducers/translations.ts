import { TYPES } from '../actions'
import _ from 'lodash'

const INITIAL_STATE = {
  downloaded: {}, // Manage version of downloaded translations
  remote: [],
}

export default function translationsReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.TRANSLATIONS.VERSION.UPDATE:
      return { ...state, downloaded: { ...state.downloaded, [payload.abbr]: payload.version } }
    case TYPES.TRANSLATIONS.SYNC:
      return { ...state, remote: _.sortBy(payload, 'abbr') }
    default:
      return state
  }
}
