import { TYPES } from '../actions'
import { RootState } from '@dts/state'

const INITIAL_STATE: RootState['actionSteps'] = {
  data: [],
  followUps: [],
  loadingActionSteps: false,
  loadingFollowUps: false,
  activeActionStep: undefined,
  dailyFlowFollowUp: undefined,
}

export default function actionStepsReducer(state: RootState['actionSteps'] = INITIAL_STATE, action): RootState['actionSteps'] {
  const { type, payload } = action

  switch (type) {
    case TYPES.ACTION_STEPS.LOAD: {
      return {
        ...state,
        loadingActionSteps: true,
      }
    }
    case TYPES.ACTION_STEPS.RECEIVE_DATA: {
      const { isLoadMore } = payload
      const data = isLoadMore ? [...(state.data ?? []), ...payload.data] : payload.data
      return {
        ...state,
        data,
        loadingActionSteps: false,
      }
    }
    case TYPES.ACTION_STEPS.CLEAR:
      return {
        ...state,
        data: [],
      }

    case TYPES.FOLLOW_UPS.LOAD: {
      return {
        ...state,
        loadingFollowUps: true,
      }
    }
    case TYPES.FOLLOW_UPS.MARK_AS_READ: {
      const { followUpId } = payload
      const updateIndex = state.followUps.findIndex(i => i.id === followUpId)
      const newFollowUps = state.followUps.map((it, index) => {
        if (updateIndex !== index) return it
        return {
          ...it,
          unread: false,
        }
      })
      return {
        ...state,
        followUps: newFollowUps,
      }
    }
    case TYPES.FOLLOW_UPS.RECEIVE_DATA: {
      const { isLoadMore } = payload
      const followUps = isLoadMore ? [...(state.followUps ?? []), ...payload.data] : payload.data
      return {
        ...state,
        followUps,
        loadingFollowUps: false,
      }
    }
    case TYPES.FOLLOW_UPS.CLEAR:
      return {
        ...state,
        followUps: [],
      }
    case TYPES.ACTION_STEPS.RECEIVE_ACTIVE_ACTION_STEP: {
      const { activeActionStep } = payload
      return {
        ...state,
        activeActionStep,
      }
    }
    case TYPES.FOLLOW_UPS.RECEIVE_DAILY_FLOW: {
      const { followUp } = payload
      return {
        ...state,
        dailyFlowFollowUp: followUp,
      }
    }
    default:
      return state
  }
}
