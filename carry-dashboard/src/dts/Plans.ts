import { GroupActionsType } from '@dts/GroupActions'
import { Timestamp } from 'firebase/firestore'

export type Plan = {
  id: string
  name: string
  description: string
  duration: number // How many days this plan take
  author: string
  // This field is added locally
  authorInfo?: {
    name?: string
    image?: string
  }
  lastUpdatedAuthor?: string
  featuredImage: string
  state: 'draft' | 'completed'
  mode: 'normal' | 'template' | 'featured' // Only Organisation Owners and Organisation Admins will be able to mark/edit a Plan as a Template or Featured Plans
  type: 'quick' | 'advanced'
  created: Timestamp
  updated: Timestamp
  deleted?: Timestamp
  blocks: Block[]
  pace?: 'day' | 'week' | 'month'
  status?: 'ended' | 'normal' | 'future'
  startDate?: Timestamp
  markAsTemplate?: boolean
  shareWithMobile?: boolean
  baseOrgPlan?: string // rawId of template plan
  campus?: { campusId: string; campusName: string } | null
  planYouTubeVideoUrl?: string
  planVideo?: string
}

export type Activity =
  | QuestionAct
  | PassageAct
  | VideoAct
  | GroupActionAct
  | TextAct

export type Block = {
  name: string
  description?: string
  activities: Activity[]
  completedMembers?: string[]
  created: Timestamp
  dayIndex?: number
}

export type Template = {
  image: string
  name: string
  days: string
}

// ********************************************************************************************************
// Plan Activities Type
// ********************************************************************************************************

export type QuestionAct = {
  type: 'question'
  question: string
}

export type PassageAct = {
  type: 'passage'
  chapter: StudyChapter
  verseRange: string
  verses?: PassageItem[]
}

export type PassageItem = {
  from: number
  to: number
}

export type StudyChapter = {
  bookId: number
  bookAbbr: string
  bookName: string
  chapterNumber: number
}

export type VideoAct = {
  type: 'video'
  title: string
  service: 'youtube' | 'web'
  description?: string
  videoId?: string // Only for youtube video
  url?: string // Only for web video
  vertical?: boolean // Only for web video
}

export type TextAct = {
  type: 'text'
  title: string
  content: string
}

export type GroupActionAct = {
  type: 'action'
  actionType: GroupActionsType
  text: string
  requestText?: string
}
