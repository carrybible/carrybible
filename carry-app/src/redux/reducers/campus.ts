import { TYPES } from '../actions'

type CampusState = App.Campus[]

const INITIAL_STATE: CampusState = []

export default function campusReducer(state = INITIAL_STATE, action: any) {
  const { type, payload } = action

  switch (type) {
    case TYPES.CAMPUS.SYNC:
      return payload.campuses
    case TYPES.ME.LOGOUT:
      return INITIAL_STATE
    default:
      return state
  }
}
