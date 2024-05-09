import db from '@shared/Database'
import { TYPES } from '../actions'

const emptyProfile = {
  uid: '',
  name: '',
  email: '',
  image: '',
}

const INITIAL_STATE = {
  ...emptyProfile,
  preferences: {
    notification: false,
    theme: 'light',
  },
}

export default function meReducer(state = INITIAL_STATE, action: any) {
  const { type, payload } = action

  switch (type) {
    case TYPES.ME.UPDATE:
      global.Analytics.identify({
        ...state,
        ...payload,
      })
      db.me = {
        ...state,
        ...payload,
      }
      return {
        ...state,
        ...payload,
      }
    case TYPES.ME.LOGOUT:
      return emptyProfile
    default:
      return state
  }
}
