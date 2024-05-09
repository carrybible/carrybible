export enum ScoreDailyActionType {
  WATCH_VIDEO = 'watch_video',
  READ_PASSAGE = 'read_passage',
  READ_TEXT = 'read_text',
  ANSWER_QUESTION = 'answer_question',
  REACT_GROUP_ACTION = 'react_group_action',

  CREATE_GROUP_ACTION = 'create_group_action',
  CREATE_PRAYER_ACTION = 'create_prayer_action',
  CREATE_GRATITUDE_ACTION = 'create_gratitude_action',

  SEND_GROUP_MESSAGE = 'send_group_message',
  SEND_DIRECT_MESSAGE = 'send_direct_message',
  SEND_THREAD_MESSAGE = 'send_thread_message',
  SEND_DISCUSSION_MESSAGE = 'send_discussion_message',

  COMPLETE_PREV_DAILY_FLOW = 'complete_prev_daily_flow',
  COMPLETE_CURRENT_DAILY_FLOW = 'complete_current_daily_flow',
  END_DAY_REDUCTION = 'end_day_reduction',
}

export const SendMessageEvents = [
  ScoreDailyActionType.SEND_DIRECT_MESSAGE,
  ScoreDailyActionType.SEND_GROUP_MESSAGE,
  ScoreDailyActionType.SEND_DISCUSSION_MESSAGE,
  ScoreDailyActionType.SEND_THREAD_MESSAGE,
  ScoreDailyActionType.REACT_GROUP_ACTION,
]

export const DEFAULT_SCORE = 50
export const MAX_SCORE = 100
export const MIN_SCORE = 0

export const SCORE_DAILY_CONFIG: {
  [actionType in ScoreDailyActionType]: {
    type: actionType
    updateMode: 'increase' | 'decrease'
    value: number
  }
} = {
  [ScoreDailyActionType.WATCH_VIDEO]: {
    type: ScoreDailyActionType.WATCH_VIDEO,
    updateMode: 'increase',
    value: 1,
  },
  [ScoreDailyActionType.READ_PASSAGE]: {
    type: ScoreDailyActionType.READ_PASSAGE,
    updateMode: 'increase',
    value: 1,
  },
  [ScoreDailyActionType.READ_TEXT]: {
    type: ScoreDailyActionType.READ_TEXT,
    updateMode: 'increase',
    value: 1,
  },
  [ScoreDailyActionType.ANSWER_QUESTION]: {
    type: ScoreDailyActionType.ANSWER_QUESTION,
    updateMode: 'increase',
    value: 2,
  },
  [ScoreDailyActionType.REACT_GROUP_ACTION]: {
    type: ScoreDailyActionType.REACT_GROUP_ACTION,
    updateMode: 'increase',
    value: 2,
  },
  [ScoreDailyActionType.CREATE_GROUP_ACTION]: {
    type: ScoreDailyActionType.CREATE_GROUP_ACTION,
    updateMode: 'increase',
    value: 3,
  },
  [ScoreDailyActionType.SEND_GROUP_MESSAGE]: {
    type: ScoreDailyActionType.SEND_GROUP_MESSAGE,
    updateMode: 'increase',
    value: 2,
  },
  [ScoreDailyActionType.SEND_DIRECT_MESSAGE]: {
    type: ScoreDailyActionType.SEND_DIRECT_MESSAGE,
    updateMode: 'increase',
    value: 2,
  },
  [ScoreDailyActionType.COMPLETE_PREV_DAILY_FLOW]: {
    type: ScoreDailyActionType.COMPLETE_PREV_DAILY_FLOW,
    updateMode: 'increase',
    value: 3,
  },
  [ScoreDailyActionType.COMPLETE_CURRENT_DAILY_FLOW]: {
    type: ScoreDailyActionType.COMPLETE_CURRENT_DAILY_FLOW,
    updateMode: 'increase',
    value: 5,
  },
  [ScoreDailyActionType.END_DAY_REDUCTION]: {
    type: ScoreDailyActionType.END_DAY_REDUCTION,
    updateMode: 'decrease',
    value: 10,
  },
  [ScoreDailyActionType.CREATE_PRAYER_ACTION]: {
    type: ScoreDailyActionType.CREATE_PRAYER_ACTION,
    updateMode: 'increase',
    value: 0,
  },
  [ScoreDailyActionType.CREATE_GRATITUDE_ACTION]: {
    type: ScoreDailyActionType.CREATE_GRATITUDE_ACTION,
    updateMode: 'increase',
    value: 0,
  },
  [ScoreDailyActionType.SEND_THREAD_MESSAGE]: {
    type: ScoreDailyActionType.SEND_THREAD_MESSAGE,
    updateMode: 'increase',
    value: 0,
  },
  [ScoreDailyActionType.SEND_DISCUSSION_MESSAGE]: {
    type: ScoreDailyActionType.SEND_DISCUSSION_MESSAGE,
    updateMode: 'increase',
    value: 0,
  },
}

// Firestore data
export type Score = {
  total: number
  updated: FirebaseFirestore.Timestamp
}

export type ScoreDailyLog = {
  [actionType in ScoreDailyActionType]: {
    createdTime: FirebaseFirestore.Timestamp
    updatedTime: FirebaseFirestore.Timestamp
    count: number
  }
}

export type GroupScoreSettingType = {
  shouldModifyScore: boolean
  shouldPatchGroupScoreData: boolean
}
