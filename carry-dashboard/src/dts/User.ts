export interface User {
  permission: string[]
  campusAccess: {
    id: string
    name: string
  }[]
  uid: string // Mo
  id?: string // Response of Stream Chat use ID
  email?: string
  name?: string
  address?: string
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
  created: any
  updated: any
  timeZone: number
  latestJoinedGroup?: string
  phoneNumber?: string
  disabledRequirePhone?: string[]
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

  organisation: UserOrganisation
  highestScoreGroup?: {
    groupId: number
    groupName: string
    groupCreated: any
  }
  buttonOverlayGroups?: Array<string>

  language: string
  isGM?: boolean
  gm?: {
    accessAll?: boolean
    organisationIds?: string[]
  }
  defaultGMAccess?: string
  groups?: string[]
  dashboardOnboarding?: {
    welcome: boolean
    groupCreated: boolean
    editPlan: boolean
    addActivity: boolean
    readySchedule: boolean
    planPublished: boolean
  }
}

export interface UserOrganisation {
  id: string
  name: string
  leader?: boolean
  role?: string
  accessedDashboard?: boolean
  campusIds?: string[]
  campusId?: string
}
