import ActionSteps from '@dts/actionSteps'
import FollowUp from '@dts/followUp'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { GroupActionInfoType } from '@scenes/GroupActions/components/GroupActionDetailViewer'
import { Campaign } from './campaign'
import { GroupActionsType } from './groupAction'

declare namespace StudyPlan {
  export interface UserPlan {
    id: string
    name: string
    description?: string
    pace: 'day' | 'week' // This value should store in plan, we don't have different block timeframe
    duration: number // How many day (/week/month) this plan take
    author: string
    owner: string
    featuredImage?: string
    state: 'draft' | 'completed' | 'bought' // draft for edit, completed is ready to use in group or change store_visible to true. bought for user who bought this plan.
    storeVisible: boolean // To enable this can visible on store or not
    version: number
    type: 'quick' | 'advanced'
    created: FirebaseFirestoreTypes.FieldValue
    updated: FirebaseFirestoreTypes.FieldValue
    deleted?: FirebaseFirestoreTypes.FieldValue // Don't need state delete, if deleted_at have value => deleted
    published?: FirebaseFirestoreTypes.FieldValue
    price?: Price
    rating?: Rating[]
    blocks: Block[]
    targetGroupId?: string // To support old flow (create a goal for a group, not for general)
    recommended?: boolean // Enable recommend plans in organisations
  }

  interface GroupPlan extends UserPlan {
    id: string // New ID for groupStudy, not use same Id of UserStudyPlan
    originalId: string // The Id of userStudyPlan
    status: 'normal' | 'ended' | 'future'
    startDate: FirebaseFirestoreTypes.FieldValue
    memberProgress: { [uid: string]: MemberStudyProgress }
    smartPlanAnswers?: { [questionKey: string]: string }
    endDate?: FirebaseFirestoreTypes.FieldValue
  }

  type MemberStudyProgress = {
    uid: string
    isCompleted: boolean
    percent: number
  }

  type Price = {
    stripePriceId: string
    currency: string
    amount: number
    type: string
  }

  type Rating = {
    uid: string
    title: string
    description?: string
    rating: number
    created: string
    updated: string
  }

  type Activity =
    | QuestionAct
    | PassageAct
    | VideoAct
    | ActionAct
    | TextAct
    | CompletedAct
    | StreakAct
    | ActStepAct
    | ActStepHighlightAct
    | GivingAct

  type Block = {
    name: string
    description?: string
    completedMembers?: string[] // when any member done this block, put userId to this array.
    activities: Activity[]
  }

  // ********************************************************************************************************
  // For more easy to custom activity like video or more. Each GroupActions will have different structure.
  // ********************************************************************************************************

  type QuestionAct = {
    question: string
    messageId?: string

    type: 'question' // studyType //
    error?: string // Save error when edit as draft
    customPassages?: CustomPassage[] // Only for handle pick verse in doing activity
    possessiveName?: string
  }

  type CustomPassage = {
    bookId: number
    chapterId: number
    toChapterId?: number
    fromVerse?: number
    toVerse?: number
    chapterNumber?: number
  }

  type PassageAct = {
    chapter?: StudyChapter // chapter // Save book and chapter
    verseRange?: string // passageText // Save range of passage as text - equal '' in case apply full verse
    verses?: PassageItem[] // passages //

    type: 'passage'
    error?: string // Save error when edit as draft
  }

  type VideoAct = {
    title: string
    description: string
    service: 'youtube' | 'web'
    videoId?: string // Only for youtube video
    url?: string // Only for web video
    vertical: boolean // Only for web video
    type: 'video'
    duration: number
    error?: string // Save error when edit as draft
  }

  type TextAct = {
    title: string
    content: string
    type: 'text'

    error?: string // Save error when edit as draft
  }

  type ActionAct = {
    type: 'action'
    actionType?: GroupActionsType
    text?: string
    requestText?: string
    action?: GroupActionInfoType // Use for show other action in StudyActivityScreen
    error?: string // Save error when edit as draft
  }

  type PassageItem = {
    from: number
    to: number
  }

  type StudyChapter = {
    bookId: number
    bookName: string
    bookAbbr: string
    chapterId: string
    chapterNumber: number
    toChapterId?: string // Optional for quick plan, from chapter to chapter
    toChapterNumber?: number
  }

  type PassageDetail = {
    chapterId?: number
    chapterName?: string
    verseId?: number
  }

  type UserProgress = {
    uid: string
    blockIndex: number
    activities: {
      type: 'passage' | 'question' | 'video'
      isCompleted: boolean // Save to change status of activity in preview screen
      stepCount: number // = 1 with question, = 1 or  = verses.length
    }[]
    isCompleted: boolean // status of user in this block
    currentStep: number // current step on totalStep
    totalStep: number // sum of all step
  }

  type SmartPlan = {
    name: string
    description?: string
    pace: 'day' | 'week' | 'month' // This value should store in plan, we don't have different block timeframe
    duration: number // How many day (/week/month) this plan take
    author: string
    owner: string
    state: 'draft' | 'completed' | 'bought'
    storeVisible: boolean // To enable this can visible on store or not
    version: number
    type: 'quick' | 'advanced'
    blocks: Block[]
    targetGroupId?: string //
    status: 'normal' | 'ended'
    summary?: { [key: string]: string }
  }

  type CompletedAct = {
    type: 'completed'
    pace: 'day' | 'week'
  }

  type StreakAct = {
    type: 'streak'
  }

  type GivingAct = {
    type: 'campaign'
    campaign: Campaign
  }

  type ActStepAct = {
    type: 'actStep'
    actionStep: ActionSteps
  }

  type ActStepHighlightAct = {
    type: 'actStepHighlight'
    followUp: FollowUp
    actionStepId: string
    messageId: string
    question?: string
  }

  type CustomIndex = {
    realIndex?: number // For save real index in case custom queue of activities
  }
}
