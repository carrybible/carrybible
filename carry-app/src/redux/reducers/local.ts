import { TYPES } from '../actions'

const INITIAL_STATE = {}

export default function localReducer(state = INITIAL_STATE, action: any) {
  const { type, payload } = action

  switch (type) {
    case TYPES.LOCAL.UPDATE:
      return {
        ...state,
        ...payload,
      }
    case TYPES.ME.LOGOUT:
      return {
        ...state,
      }
    default:
      return state
  }
}
