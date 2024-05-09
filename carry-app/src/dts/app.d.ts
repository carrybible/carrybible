import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
declare namespace App {
  type GoalStatus = 'ongoing' | 'upcoming' | 'ended' | 'unknown'

  interface Reading {
    bookId: number
    chapterId: number
    rootId: number
  }

  interface Pace {
    duration: 'day' | 'week'
    chapter: number
  }

  interface Translation {
    name: string
    abbr: string
    usfmPath?: string
    indexPath?: string
    carryPath?: string
    usfmId?: string
    indexId?: string
    carryId?: string
    version: number
    lang?: string
    created?: any
    updated?: any
  }

  export interface Reminder {
    enabled: boolean
    time?: string
    timeString?: string
    updated?: number
  }

  export interface User {
    uid: string // Mo
    id?: string // Response of Stream Chat use ID
    email?: string
    name?: string
    age?: number
    displayName?: string // Response of appleId
    image?: string
    habit?: number
    reading?: number
    describe?: string
    translation?: string
    translationId?: string
    streamToken: string
    theme?: 'light' | 'dark'
    preferences: {
      visibility: 'private' | 'public'
    }
    reminder?: Reminder
    created: any
    updated: any
    timeZone: string
    latestJoinedGroup?: string
    phoneNumber?: string
    disabledRequirePhone?: string[]
    // streaks
    // For record streak
    lastForgiveDate: any // The last day that user using Streak Forgiveness
    streakStartDate: any // start date of the streak when current streak increase from 0 -> 1
    lastStreakDate: any // time when today streak is counted
    longestStreak?: number // the longest streak count
    totalStreak: number // everytime user finishes a streak, add 1 to this field // total all time

    nextStreakExpireDate: any // updated when today streak is finished = 23:59:59 on tomorrow
    currentStreak?: number // current streak count, increase when user completes today task

    todayStreakProgress: number // today streak count has completed // don't need any more

    isRating?: boolean // if user rating to appstore - google play
    // isCancelRating?: boolean // user open rating but not submit
    isFeedback?: boolean // if user is feedback in google form
    nextStreakToRating?: number

    organisation?: UserOrganisation
    highestScoreGroup?: {
      groupId: number
      groupName: string
      groupCreated: any
    }
    buttonOverlayGroups?: Array<string>

    language: string
  }

  export interface Group {
    activeGoal?: {
      id: string
      startDate: any
      endDate?: any
      status?: string
      studyType?: string
      pace?:
        | string
        | {
            duration: string
          }
    }
    id: string
    owner: string
    name: string
    timeZone: number
    description?: string
    hasActiveGoal: boolean
    disabledAutoAction?: boolean
    image: string
    communicationType: 'group' | 'direct'
    directMessageId?: string
    service: 'StreamIO'
    cid?: string
    visibility: string
    deleted?: boolean
    members: Array<string>
    memberCount: number
    created: any
    updated: any
    isNewGroup: boolean
    // Age
    age: string
    ageFrom: number
    ageTo: number
    // Location
    location: string
    locationLatLng: any
    // Activity
    activity: number //
    activityToday: { messageSent: number; goalCompleted: number; score: number }
    activityAvg: { messageSent: number; goalCompleted: number; score: number }

    smartPlanAnswers?: { [key: string]: string }

    organisation?: UserOrganisation
  }

  export interface UserOrganisation {
    id: string
    role?: string
    campusIds?: string[]
    campusId?: string
  }

  interface Organisation {
    id: string
    image?: string
    name: string
    hasPlans?: boolean
    subscription?: {
      active: boolean
      auto_renew_status: boolean
      product_id: string
      expires_date: number
      expires_date_ms: number
      original_transaction_id: string
    }
    leaders?: string[]
    members?: string[]
    isRequirePhone?: boolean
    newGroupPermission?: 'member' | 'leader'
    giving?: {
      allowSetup?: boolean
      stripeAccount?: {
        id?: string
      }
      isConnected?: boolean
    }
  }

  export interface Campus {
    id: string
    name: string
    image: string
    city: string
    state: string
    country: string
    region: string
    organisationId: string
    //who create this campus, just for record
    owner: string
    groups: string[]
    created: any
    updated: any
    createBy?: string
    updateBy?: string
    //Leaders manage campus
    leaders: string[]

    memberCount?: number
    members?: string[]
    groupCount?: number
    totalPraise?: number
    totalPrayer?: number
    totalReadingTime?: number
  }

  export type CampusPermission = {
    campusName?: string
    campusId: string
    createBy: string
    permission: string
    updateBy: string
  }

  export type MemberOrg = {
    uid: string
    organisation: {
      accessedDashboard: boolean
      campusIds: string[]
      role: string
    }
  }

  export interface Thread {
    id: string
    text: string
    creator: User
    creatorId: string
    participantIds: Array<string>
    participants?: Array<User>
    type: 'thread' | 'goal'

    replyCount: number
    viewers?: { id: string; last_read: any; last_reply_count: number }[]

    // For thread type
    blockIndex?: number
    planID?: string

    // For goal type
    reading?: string

    updated: any
    startDate: any
  }

  export interface UnreadThread {
    uid: string
    groupId: string
    threadId: string
    planId?: string
    isUnread: boolean
    threadStartDate: any
    updated: any
  }

  export interface Note {
    created: any
    updated: any
    rootId: number
    rootIdStr: string
    osis?: string
    text: string
    id: string
  }

  export interface FuncInviteGetResponse {
    inviter?: User
    group: Group
    isGroupMember: boolean
    message?: string
  }

  export interface Participant {
    userId: string
    currentProgress: number
  }

  export interface Goal {
    id: string
    currentPeriod?: number
    participants?: Participant[]
    pace: Pace //how many chapter / per day or month
    questions: Array<string>
    status: 'normal' | 'ended'
    startDate: any
    endDate: any
    from: Reading
    to: Reading
    totalChapters: number
    totalPeriod: number
    owner: { userId: string; timeZone: number }
    created: any
    updated: any
  }

  export interface StudyPassage {
    from: number
    to: number
  }
  export type StudyType = 'question' | 'passage'
  export type PaceType = 'day' | 'week' | 'month'
  export type StudyChapter = {
    bookId: number
    bookName: string
    bookAbbr: string
    chapterId: string
    chapterNumber: number
  }

  export interface StudyItem {
    error?: string
    studyType: StudyType

    //For question
    question?: string

    //For reading
    chapter?: StudyChapter
    passageText?: string // Save range of passage
    passages?: StudyPassage[]

    focus?: boolean //Only use for UI in case check auto focus
  }

  export interface StudyBlock {
    pace?: PaceType
    title?: string
    studyGoals: StudyItem[]
  }

  export interface AdvancedGoal {
    id?: string
    currentPeriod?: number // Current period in total of goal
    totalPeriod: number // Total day or week
    pace?: PaceType
    title?: string
    groupId?: string

    blocks?: StudyBlock[]

    participants?: Participant // After read, userId will set to this array.
    progress?: any

    status?: 'draft' | 'normal' | 'ended'
    studyType?: 'advanced'
    startDate?: any
    endDate?: any

    owner?: { userId: string; timeZone: number }
    created?: any
    updated?: any
  }

  export interface Period {
    id: string
    activeDate: any
    reading: number[]
    questions: string[]
    goalId: string
    threads: [{ threadId: string; question: string }]
    periodNumber: number
    totalStep: number
    totalReading: number
    totalPeriod: number
    owner: { userId: string; timeZone: number }
    completedUsers: string[]
  }

  export interface History {
    id: string
    historyId: string
    userId: string
    periodId: string
    goalId: string
    periodNumber: number
    completed: boolean
    completedStepCount: number
    reading: {
      rootId: number
      completed: boolean
    }[]
    completedReadingCount: number
    questions: {
      threadId: string
      question: string
      completed: boolean
    }[]
    completedQuestionCount: number
    updated: any
  }

  export interface Codes {
    acceptCount: number
    created: any
    updated: any
    organisationId?: string
    groupId?: string
    code: string
    sharedGroups?: string[]
    acceptance?: string[]
  }

  export interface UserCampaign {
    showedStudy?: {
      blockIndex: number
      planId: string
    }
    updated?: FirebaseFirestoreTypes.FieldValue
  }
}
