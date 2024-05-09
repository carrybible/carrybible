import { TYPES } from '../actions'
import { RootState } from '@dts/state'

const INITIAL_STATE: RootState['settings'] = {
  populatedPrompt: {
    prayer: [],
    gratitude: [],
  },
  currencies: {},
}

export default function settingReducer(state: RootState['settings'] = INITIAL_STATE, action) {
  const { type, payload } = action

  switch (type) {
    case TYPES.SETTINGS.UPDATE: {
      return { ...state, ...payload }
    }
    default:
      return state
  }
}
