import { TYPES } from '../actions'
import { RootState } from '@dts/state'

const INITIAL_STATE: RootState['groupActions'] = {
  type: 'prayer',
  data: undefined,
}

export default function groupActionsReducer(state: RootState['groupActions'] = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.GROUP_ACTIONS.LOAD: {
      return {
        ...state,
        type: payload.type,
      }
    }
    case TYPES.GROUP_ACTIONS.RECEIVE_DATA: {
      const { isLoadMore } = payload
      const data = isLoadMore ? [...(state.data ?? []), ...payload.data] : payload.data
      return {
        ...state,
        data,
      }
    }
    case TYPES.GROUP_ACTIONS.VIEW: {
      const { id } = payload
      return {
        ...state,
        data: state.data?.map(item => (item.id === id ? { ...item, unread: false } : item)),
      }
    }
    case TYPES.GROUP_ACTIONS.CLEAR: {
      return INITIAL_STATE
    }
    default:
      return state
  }
}
