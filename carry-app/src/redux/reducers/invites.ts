import _ from 'lodash'
import { TYPES } from '../actions'

const empty = { join: undefined, follow: undefined }

const INITIAL_STATE = empty

export default function invitesReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.INVITES.FOLLOW.PENDING:
      if (payload && payload.id !== _.get(state, 'follow.id', '0')) return { ...state, follow: { ...payload, accepted: false } }
      return state
    case TYPES.INVITES.FOLLOW.ACCEPTED:
      return { ...state, follow: { ...state.follow, channelID: payload.channelID, accepted: true } }
    case TYPES.INVITES.FOLLOW.SUCCESS:
      return { ...state, follow: undefined }
    case TYPES.INVITES.FOLLOW.REJECTED:
      return { ...state, follow: undefined }
    case TYPES.INVITES.JOIN.PENDING:
      return { ...state, join: { ...payload, accepted: false } }
    case TYPES.INVITES.JOIN.ACCEPTED:
      return { ...state, join: { ...state.join, ...payload, accepted: true } }
    case TYPES.INVITES.JOIN.SUCCESS:
      return { ...state, join: undefined }
    case TYPES.INVITES.JOIN.REJECTED:
      return { ...state, join: undefined }
    case TYPES.INVITES.SENT:
      return { ...state, [payload]: new Date(), updated: Date.now() }
    case TYPES.INVITES.FOLLOWED:
      return { ...state, followed: payload }
    case TYPES.INVITES.FOLLOWED_INVITE:
      return { ...state, followedInvite: payload }
    case TYPES.ME.LOGOUT:
      return empty
    default:
      return state
  }
}
