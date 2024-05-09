//Some hard code structure to create plan
export interface SmartPlan {
  supportsWeekends: boolean
  id: string
  name: string
  description?: string
  pace: 'day' | 'week' | 'month'
  blocks: SmartBlock[]
  published: boolean

  questions: {
    [key: string]: string
  }
  /* Defined what question that this plan will suitable with
    Example: {
    QUESTION_GROUP_CONSTITUTION: 'ANSWER_LONG_TERM',
    QUESTION_GROUP_PURPOSE: 'ANSWER_FORMAL_GROUP',
    QUESTION_GROUP_STUDY_TIME: 'ANSWER_5_MINS',
  }
   */
}

export type SmartBlock = {
  name: string
  type: string
  activities: (SmartQuestionAct | SmartPassageAct | SmartVideoAct | SmartActionsAct | SmartTextAct)[]
}

export type SmartQuestionAct = {
  question: string
}
export type SmartVideoAct = {
  title: string
  description: string
  service: string // Currently only support youtube
  duration: number
  videoId: string
}

export type SmartPassageAct = {
  bookId: number
  bookName: string
  bookAbbr: string
  chapterId: number
  toChapterId?: number // In case show full chapter
  verses?: { from: number; to: number }[] // In case only show some verses
}

export type SmartActionsAct = {
  actionType: 'prayer' | 'gratitude'
  text: string
}

export type SmartTextAct = {
  content: string
}
