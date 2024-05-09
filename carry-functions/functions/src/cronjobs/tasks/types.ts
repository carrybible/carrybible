export interface WorkerType {
  worker: 'one_time' | 'planned' | 'recurring'
  status: 'scheduled' | 'success' | 'error'
  performAt: FirebaseFirestore.Timestamp
  data: any
  errorMessage?: string[]
  uid: string
}

export const EVENTS = {
  info: 'INFO_ONLY',
  remind_daily_flow: 'REMIND_DAILY_FLOW',
  remind_pray: 'REMIND_PRAY',
  complete_goal: 'COMPLETE_GOAL',
  joined_group: 'JOINED_GROUP',
  left_group: 'LEFT_GROUP',
  group_action_created: 'GROUP_ACTION_CREATED',
}
