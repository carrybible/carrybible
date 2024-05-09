import { TYPES } from '../actions'

const INITIAL_STATE = {
  campaigns: [],
  activeCampaigns: [],
  endedCampaigns: [],
  tithings: [],
  userCampaign: {},
}

export default function organisationReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.ORGANISATION.UPDATE:
      return { ...state, ...payload }
    case TYPES.ME.LOGOUT:
      return INITIAL_STATE
    default:
      return state
  }
}
