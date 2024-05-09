import { TYPES } from '../actions'

const INITIAL_STATE = {
  loadingMessage: '',
  loading: false,
  currentScreen: '',
}

export default function screenReducer(state = INITIAL_STATE, action: any) {
  const { type, payload } = action

  switch (type) {
    case TYPES.SCREEN.SHOW_LOADING:
      return {
        ...state,
        loading: true,
        loadingMessage: payload.message || '',
      }
    case TYPES.SCREEN.HIDE_LOADING:
      return {
        ...state,
        loading: false,
        loadingMessage: '',
      }
    case TYPES.SCREEN.CHANGE_SCREEN:
      return {
        ...state,
        currentScreen: payload,
      }
    case TYPES.ME.UPDATE: {
      if (global.LOGIN_LOADING && state.loading && payload) {
        global.LOGIN_LOADING = false
        return {
          ...state,
          loading: false,
          loadingMessage: '',
        }
      }
      return state
    }
    default:
      return state
  }
}
