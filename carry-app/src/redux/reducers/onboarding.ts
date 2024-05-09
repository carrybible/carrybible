import { StudyPlan } from '@dts/study'
import { AnyAction } from 'redux'
import { TYPES } from '../actions'

const DEFAULT_PIC =
  'https://images.unsplash.com/photo-1485201543483-f06c8d2a8fb4?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1275&q=80'

export interface Avatar {
  url?: string
  type?: string
}

export interface OnboardingState {
  groupId?: string
  organisationId?: string
  groupName?: string
  groupAvatar?: Avatar
  responses?: Array<any>
  inviteId?: string
  quickStudyPlan?: any
  advancedPlan?: StudyPlan.UserPlan
  smartPlan?: StudyPlan.SmartPlan
  startDate?: Date
  endDate?: Date
}

const INITIAL_STATE = {
  groupId: '',
  organisationId: '',
  groupName: '',
  groupAvatar: {
    url: DEFAULT_PIC,
    type: '',
  },
  responses: [],
  inviteId: '',
  startDate: new Date(),
  endDate: undefined,
}

export default function onboardingReducer(state = INITIAL_STATE, action: AnyAction): OnboardingState {
  switch (action.type) {
    case TYPES.ONBOARDING.SET_GROUP_ID:
      return {
        ...state,
        groupId: action.groupId,
      }
    case TYPES.ONBOARDING.SET_NAME:
      return {
        ...state,
        groupName: action.name,
      }
    case TYPES.ONBOARDING.SET_AVATAR:
      return {
        ...state,
        groupAvatar: action.avatar,
      }
    case TYPES.ONBOARDING.SET_ANSWERS:
      return {
        ...state,
        responses: state.responses.slice(0, action.index).concat(action.response),
      }
    case TYPES.ONBOARDING.SET_SMART_PLAN:
      return {
        ...state,
        smartPlan: action.response,
      }
    case TYPES.ONBOARDING.SET_INVITE_ID:
      return {
        ...state,
        inviteId: action.invitationId,
      }
    case TYPES.ONBOARDING.SET_QUICK_STUDY_PLAN:
      return {
        ...state,
        quickStudyPlan: action.quickStudyPlan,
      }
    case TYPES.ONBOARDING.SET_ADVANCED_STUDY_PLAN:
      return {
        ...state,
        advancedPlan: action.advancedPlan,
      }
    case TYPES.ONBOARDING.SET_START_DATE:
      return {
        ...state,
        startDate: action.startDate,
      }
    case TYPES.ONBOARDING.SET_END_DATE:
      return {
        ...state,
        endDate: action.endDate,
      }
    case TYPES.ONBOARDING.SET_ORG_ID:
      return {
        ...state,
        organisationId: action.organisationId,
      }
    case TYPES.ONBOARDING.CLEAR:
      return { ...INITIAL_STATE }
    default:
      return state
  }
}
