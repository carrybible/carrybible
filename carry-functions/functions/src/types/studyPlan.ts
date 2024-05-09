import { FieldValue } from '@google-cloud/firestore'

export interface UserPlan {
  id: string
  name: string
  description?: string
  pace: 'day' | 'week' | 'month' // This value should store in plan, we don't have different block timeframe
  duration: number // How many day (/week/month) this plan take
  author: string
  owner: string
  featuredImage?: string
  state: 'draft' | 'completed' | 'bought' // draft for edit, completed is ready to use in group or change store_visible to true. bought for user who bought this plan.
  storeVisible: boolean // To enable this can visible on store or not
  version: number
  type: 'quick' | 'advanced'
  created: FirebaseFirestore.Timestamp
  updated: FirebaseFirestore.Timestamp
  deleted?: FirebaseFirestore.Timestamp // Don't need state delete, if deleted_at have value => deleted
  published?: FirebaseFirestore.Timestamp
  price?: Price
  rating?: Rating[]
  blocks: Block[]
  targetGroupId?: string // To support old flow (create a goal for a group, not for general)
  migrate?: boolean,
  origin?: 'video',
  planVideoId?: string,
}

export interface GroupPlan extends UserPlan {
  id: string // New ID for groupStudy, not use same Id of UserStudyPlan
  originalId: string // The Id of userStudyPlan
  status: 'normal' | 'ended' | 'future'
  startDate: FirebaseFirestore.Timestamp
  memberProgress: { [uid: string]: MemberStudyProgress }
  smartPlanAnswers?: { [questionKey: string]: string },
  groupVideoId?: string,
}

export type MemberStudyProgress = {
  uid: string
  isCompleted: boolean
  percent: number
  totalReadingTime: number
}

export type Price = {
  stripePriceId: string
  currency: string
  amount: number
  type: string
}

export type Rating = {
  uid: string
  title: string
  description?: string
  rating: number
  created: string
  updated: string
}

export type Block = {
  name: string
  description?: string
  completedMembers?: string[] // when any member done this block, put userId to this array.
  activities: (QuestionAct | PassageAct | VideoAct | ActionAct)[] // QuestionAct | PassageAct
}

// ********************************************************************************************************
// For more easy to custom activity like video or more. Each Activity will have different structure.
// ********************************************************************************************************

export type QuestionAct = {
  question: string
  messageId?: string

  type: 'question' // studyType //
  error?: string // Save error when edit as draft
}

export type PassageAct = {
  chapter?: StudyChapter // chapter // Save book and chapter
  verseRange?: string // passageText // Save range of passage as text - equal '' in case apply full verse
  verses?: PassageItem[] // passages //

  type: 'passage'
  error?: string // Save error when edit as draft
}

export type VideoAct = {
  title: string
  description: string
  service: 'youtube'
  videoId?: string
  type: 'video'
  duration: number
  error?: string // Save error when edit as draft
}

type ActionAct = {
  type: 'action'
  actionType: 'prayer' | 'gratitude'
  text?: string
}

export type PassageItem = {
  from: number
  to: number
}

export type StudyChapter = {
  bookId: number
  bookName: string
  bookAbbr: string
  chapterId: string
  chapterNumber: number
  toChapterId?: string // Optional for quick plan, from chapter to chapter
  toChapterNumber?: number
}

export type PassageDetail = {
  chapterId?: number
  chapterName?: string
  verseId?: number
}

export type UserProgress = {
  uid: string
  blockIndex: number
  activities: {
    type: 'passage' | 'question' | 'video' | 'action'
    isCompleted: boolean // Save to change status of activity in preview screen
    stepCount: number // = 1 with question, = 1 or  = verses.length
    readingTime?: number
  }[]
  isCompleted: boolean // status of user in this block
  currentStep: number // current step on totalStep
  totalStep: number // sum of all step
  totalReadingTime: number // sum of reading time for passage
  created?: FieldValue
  updated?: FieldValue
}
