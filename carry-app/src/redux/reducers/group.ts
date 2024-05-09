import { TYPES } from '../actions'

const INITIAL_STATE = {
  id: '',
  channel: null,
  isOwner: false,
  directMsgRenderCount: 0,
  reloadGroupChatCount: 0,
  groupActions: {
    prayer: [],
    gratitude: [],
  },
  unreadDirectMessage: {},
  unreadGroupMessage: 0,
}

export default function groupReducer(state = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.GROUP.OPEN_GROUP_SCREEN: {
      if (payload !== state.id) {
        return { ...INITIAL_STATE, id: payload }
      }
      return state
    }
    case TYPES.GROUP.UPDATE:
      return { ...state, ...payload }
    case TYPES.GROUP.CLOSE_GROUP_SCREEN:
      return INITIAL_STATE
    case TYPES.ME.LOGOUT:
      return []
    case TYPES.GROUP.RELOAD_DIRECT_MESSAGES:
      return { ...state, directMsgRenderCount: state.directMsgRenderCount + 1 }
    case TYPES.GROUP.RELOAD_GROUP_CHAT:
      return { ...state, reloadGroupChatCount: state.reloadGroupChatCount + 1 }
    case TYPES.GROUP.RESET_DIRECT_MESSAGES_UNREAD_COUNT:
      return {
        ...state,
        unreadDirectMessage: {},
      }
    case TYPES.GROUP.UPDATE_DIRECT_MESSAGES_UNREAD_COUNT:
      return {
        ...state,
        unreadDirectMessage: payload,
      }
    case TYPES.GROUP.UPDATE_GROUP_MESSAGES_UNREAD_COUNT:
      return {
        ...state,
        unreadGroupMessage: payload,
      }
    default:
      return state
  }
}
