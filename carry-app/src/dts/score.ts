/* eslint-disable no-unused-vars */
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

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

export type Score = {
  total: number
  updated: FirebaseFirestoreTypes.Timestamp
}
