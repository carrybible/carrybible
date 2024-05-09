import { TYPES } from '../actions'

const INITIAL_STATE = {
  groups: {},
  ids: [],
}

export default function groupsReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.GROUPS.SYNC:
      return payload
    case TYPES.ME.LOGOUT:
      return []
    default:
      return state
  }
}
