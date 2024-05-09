declare namespace Carry {
  type Subscription = {
    active: boolean
    auto_renew_status: boolean
    product_id: string
    expires_date?: Date
    expires_date_ms?: number
    original_transaction_id?: string
  }
  interface Reading {
    bookId: number
    chapterId: number
    rootId: number
  }

  interface Pace {
    duration: 'day' | 'week'
    chapter: number
  }

  interface Price {
    stripe_price_id: string
    currency: string
    amount: number
    type: 'one_time' | 'recurring'
  }

  export interface Block {
    name: string
    description?: string
    timeframe: 'day' | 'week' | 'month'
    start_at: number
    activities?: Array<ActivityType>
  }

  export interface ActivityType {
    type: 'question' | 'passage'
    question?: string
    messageId?: string
    chapter?: {
      bookAbbr: string
      bookId: number
      bookName: string
      chapterId: number
      chapterNumber: number
      toChapterId: number
      toChapterNumber: number
    }
  }

  export interface Passage {
    from_book: string
    from_chapter: number
    from_verse?: number
    to_book?: string
    to_chapter?: number
    to_verse?: number
  }

  export interface Question {
    title: string
    description?: string
    messageId?: string
  }

  export interface StudyPlan {
    id: string
    name: string
    description?: string
    author: string
    visibility: 'public' | 'private'
    version: number
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    blocks: Array<Block>
  }

  export interface UserRating {
    user_id: string
    title: string
    description: string
    rating: number
    created_at: number
    updated_at: number
  }

  export interface Invite {
    groupId: string
    uid: string
    url: string
    acceptance?: string[]
    qrCodeUrl?: string
    created: FirebaseFirestore.Timestamp
  }

  export interface FuturePlan {
    id: string
    startTime: Date
    endTime: Date
  }

  export interface Group {
    queuedPlans: string[]
    smartPlanAnswers: { [questionKey: string]: string }
    organisation?: { id: string; campusId?: string }
    previousPlans: string[]
    id: string
    owner: string
    name?: string
    description?: string
    image: string
    activeGoal?: Goal | AdvancedGoal
    hasActiveGoal: boolean
    communicationType: 'group' | 'direct'
    directMessageId?: string
    service: 'StreamIO'
    cid?: string
    visibility: 'public' | 'private'
    tier: 'free'
    verified: 'carry' | 'none'
    deleted?: boolean
    members: Array<string>
    muteMembers?: Array<string>
    memberCount: number
    customQuestion: string
    isNewGroup: boolean
    hasActionStepFeature?: boolean
    ageFrom: number
    ageTo: number
    age: string
    location?: string
    locationLatLng?: FirebaseFirestore.GeoPoint

    publicEnemy?: boolean // Group create after version 0.9.0

    // Activity
    activity: number //
    activityToday: { messageSent: number; goalCompleted: number; score: number }
    activityAvg: { messageSent: number; goalCompleted: number; score: number }

    subscription?: Subscription

    timeZone: number
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    nextPeriod: FirebaseFirestore.Timestamp

    orgSyncStatus?: string

    // Exist in Org/groups
    mixpanelCache?: {
      time: number
      message: MixCount
      prayer: MixCount
      gratitude: MixCount
    }

    campaignIds?: string[]
    fundId?: string

    totalPraise?: number
    totalPrayer?: number
    totalMessage?: number
    totalReadingTime?: number

    // Record data
    recentPraise?: LastUser[]
    recentPrayer?: LastUser[]
    recentMessage?: LastUser[]
    recentReading?: LastUser[]
  }

  export interface User {
    uid: string
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    email?: string
    name?: string
    displayName?: string
    image?: string
    reading?: string
    streamToken: string
    visibility: 'private' | 'public'
    subscription?: Subscription
    freemium?: boolean // If user don't have this value => everything go premium (set wrong name)
    organisation?: {
      id: string
      accessedDashboard?: boolean
      role: 'member' | 'leader' | 'campus-leader' | 'campus-user' | 'admin' | 'owner'
      campusId?: string //Default Campus, if null user is using default campus of organisation
      campusIds?: string[]
    }
    permission?: string[]
    groups: Array<string>
    highestScoreGroup?: {
      groupId: number
      groupName: string
      groupCreated: FirebaseFirestore.Timestamp
    }
    firstCreatedGroupId?: string
    groups: Array<string>

    // Streak
    nextStreakExpireDate?: FirebaseFirestore.Timestamp
    lastStreakDate?: FirebaseFirestore.Timestamp
    streakStartDate?: FirebaseFirestore.Timestamp
    todayStreakProgress?: number
    longestStreak?: number
    currentStreak?: number
    totalStreak?: number
    lastForgiveDate?: FirebaseFirestore.Timestamp
    phone?: string
    state?: string
    city?: string
    country?: string
    region?: string

    orgSyncStatus?: string
    joined?: FirebaseFirestore.Timestamp // exist in org/members
    totalPraise?: number
    totalPrayer?: number
    totalReadingTime?: number
    totalMessage?: number
    isGM?: boolean
    gm?: {
      accessAll?: boolean
      organisationIds?: string[]
    }
    defaultGMAccess?: string

    stripeCustomerIds?: {
      [orgId: string]: string
    }

    paymentMethods?: string[]
    mixpanelCache?: {
      time: number
      message: MixCount
      prayer: MixCount
      gratitude: MixCount
    }
    latestJoinedGroup?: string
    language?: string
  }

  export interface Thread {
    id: string
    text: string
    participantIds: Array<string>
    participants?: Array<any>
    replyCount: number
    creator: User
    creatorId: string
    reading?: number[]
    goalId?: string
    planID?: string
    type: 'thread' | 'goal'
    viewers?: { id: string; last_read: FirebaseFirestore.Timestamp; last_reply_count: number }[]
    updated: FirebaseFirestore.Timestamp
    created: FirebaseFirestore.Timestamp
    startDate: FirebaseFirestore.Timestamp
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

  export interface Translation {
    name: string
    abbr: string
    usfmPath?: string
    usfmId?: string
    indexPath?: string
    indexId?: string
    carryPath?: string
    carryId?: string
    version: number
    lang?: string
    created?: FirebaseFirestore.Timestamp
    updated?: FirebaseFirestore.Timestamp
  }

  export interface Period extends FirebaseFirestore.DocumentData {
    activeDate: FirebaseFirestore.Timestamp
    reading: number[]
    questions: string[]
    goalId: string
    threads: [{ threadId: string; question: string }]
    periodNumber: number
    totalSteps: number
    totalReading: number
    totalPeriod: number
    owner: { userId: string; timeZone: number }
    completedUsers: string[]
  }

  export interface PeriodAdvanced extends FirebaseFirestore.DocumentData {
    activeDate: FirebaseFirestore.Timestamp
    goalId: string
    threads: [{ threadId: string; question: string }]
    periodNumber: number
    totalStep: number
    owner: { userId: string; timeZone: number }
    blocks: Array<StudyBlock>
    completedUsers: string[]
    studyType: string
  }

  export interface Goal extends FirebaseFirestore.DocumentData {
    id: string
    participants: { [key: string]: string }
    pace: Pace
    questions: Array<string>
    status: 'normal' | 'ended'
    startDate: FirebaseFirestore.Timestamp
    endDate: FirebaseFirestore.Timestamp
    from: Reading
    to: Reading
    totalChapters: number
    totalPeriod: number
    currentPeriod: number
    owner: { userId: string; timeZone: number }
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
  }

  export interface StudyChapter extends FirebaseFirestore.DocumentData {
    bookId: number
    bookName: string
    bookAbbr: string
    chapterId: string
    chapterNumber: number
  }

  export interface StudyPassage extends FirebaseFirestore.DocumentData {
    from: number
    to: number
  }

  export interface StudyItem extends FirebaseFirestore.DocumentData {
    error?: string
    studyType: 'question' | 'passage'

    //For question
    question?: string

    //For reading
    chapter?: StudyChapter
    passageText?: string // Save range of passage
    passages?: Array<StudyPassage>

    focus?: boolean //Only use for UI in case check auto focus
  }

  export interface StudyBlock extends FirebaseFirestore.DocumentData {
    pace: 'week' | 'day'
    title: string
    studyGoals: Array<StudyItem>
  }

  export interface AdvancedGoal extends FirebaseFirestore.DocumentData {
    id: string
    participants: { [key: string]: string }
    pace: 'week' | 'day'
    status: 'draft' | 'normal' | 'ended'
    startDate: FirebaseFirestore.Timestamp
    endDate: FirebaseFirestore.Timestamp

    studyType: 'advanced'

    totalPeriod: number
    currentPeriod: number

    blocks: Array<StudyBlock>

    progress: any

    title: string
    groupId: string
    owner: { userId: string; timeZone: number }
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
  }

  export interface History extends FirebaseFirestore.DocumentData {
    completed: boolean
    completedQuestionCount: number
    completedReadingCount: number
    completedStepCount: number
    userId: string
    finishedStepCount: number
    status: number
    questions: Array<Map<string, string>>
    readChapter: Array<string>
  }

  export interface Organisation extends FirebaseFirestore.DocumentData {
    hasPlans?: boolean
    id: string
    name: string
    subscription?: {
      active?: boolean
    }
    giving: {
      allowSetup?: boolean
      stripeAccount?: Stripe.Response<Stripe.Account>
      accountLink?: Stripe.Response<Stripe.AccountLink>
      isConnected?: boolean // Temporary save status
    }
    image?: string
    leaders?: Array<string>
    memberCount?: number
    groupCount?: number
    totalCampus?: number
    mixpanelCache?: {
      time: number
      message: MixCount
      prayer: MixCount
      gratitude: MixCount
    }
    owners?: string[]

    totalPraise?: number
    totalPrayer?: number
    totalMessage?: number
    totalReadingTime?: number

    // Record data
    recentPraise?: LastUser[]
    recentPrayer?: LastUser[]
    recentMessage?: LastUser[]
    recentReading?: LastUser[]
  }

  export interface LastUser {
    uid: string
    name: string
    image?: string
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
    defaultCurrency?: string
  }

  export interface ActionStep {
    id: string
    updated: number

    // ----- Render fields, if empty will render default text -----
    actionText: string
    actionTextId?: string
    actionPromptText?: string
    followUpPromptText?: string
    highlightPromptText?: string

    completedMembers: string[] // members that completed this action step
    status: ActionStepStatus // In a group at a same time, there will be only one active action step
    fromDate: any
    toDate: any

    // ----- Server generated and updated -----
    followUpMembers?: string[] // members that completed this action step AND provide follow up
    followUpCount?: number
  }

  export interface FollowUp {
    id: string
    content: string
    updated: FirebaseFirestore.Timestamp
    creatorInfo: {
      userId: string
      image?: string
      name?: string
    }
    viewers: Array<string>
  }

  export interface UnreadFollowUp {
    updated: FirebaseFirestore.Timestamp
    count: number
    unreadFollowUps: string[]
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
    created: datetime
    updated: datetime
    createBy?: string
    updateBy?: string
    //Leaders manage campus
    leaders: string[]

    memberCount?: number
    members?: string[]
    groupCount?: number
    mixpanelCache?: {
      time: number
      message: MixCount
      prayer: MixCount
      gratitude: MixCount
    }

    totalPraise?: number
    totalPrayer?: number
    totalMessage?: number
    totalReadingTime?: number

    // Record data
    recentPraise?: LastUser[]
    recentPrayer?: LastUser[]
    recentMessage?: LastUser[]
    recentReading?: LastUser[]
  }

  export interface EmailInvite {
    id: string
    uid?: string
    email: string
    role: 'leader' | 'campus-leader' | 'campus-user' | 'admin' | 'member' | 'owner'
    target: {
      type: 'create-group' | 'add-dashboard-user'
      details: {
        name?: string
        groupId?: string
        campusId?: string
        organisationId?: string
        timeZone?: string
      }
    }
    code: string
    created: datetime
    updated: datetime
    userInvite: string
    accepted: boolean
  }

  export type MixCount = {
    total: number
    latestUsers: any[]
  }

  export type Plan = {
    id: string
    name: string
    description: string
    duration: number // How many days this plan take
    author: string
    // This field is added locally
    authorInfo?: {
      name: string
      image: string
    }
    lastUpdatedAuthor?: string
    featuredImage: string
    state: 'draft' | 'completed'
    mode: 'normal' | 'template' | 'featured' // Only Organisation Owners and Organisation Admins will be able to mark/edit a Plan as a Template or Featured Plans
    type: 'quick' | 'advanced'
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    deleted?: FirebaseFirestore.Timestamp
    blocks: Block[]
    pace?: 'day' | 'week' | 'month'
    status?: 'ended' | 'normal' | 'future'
    startDate?: FirebaseFirestore.Timestamp
    markAsTemplate?: boolean
    shareWithMobile?: boolean
    baseOrgPlan?: string // rawId of template plan
    campus?: { campusId: string; campusName: string }
  }

  export type Tracking = {
    addToLeaderBy: string
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    campusId?: string
    type: 'campus'
  }

  export type Campaign = {
    id: string
    name: string
    image: string
    description: string
    totalFunds: number
    donorIds: string[]
    goalAmount: number
    suggestionAmounts: number[]
    currency: string
    organizationId: stirng
    campusIds: string[]
    groupIds: string[]
    startDate?: FirebaseFirestore.Timestamp
    endDate?: FirebaseFirestore.Timestamp
    video?: {
      title: string
      url: string
      thumbnail?: string
      type: 'youtube' | 'web'
      description?: string
    }
    status: 'draft' | 'active' | 'ended'
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    createBy?: string
    updateBy?: string
  }

  export type Donation = {
    id: string
    uid: string
    campusId?: string
    groupId?: string
    campaignId?: string
    fundId?: string
    organisationId: string
    transactionDetails: {
      //Transaction object from Stripe
      payType: 'paymentIntent' | 'checkout'
      transactionObj: any
      paymentId: string
      checkoutId?: string
    }
    type: 'campaign' | 'fund'
    amount: number
    currency: string
    email?: string
    paidAt: FirebaseFirestore.Timestamp
    created: FirebaseFirestore.Timestamp
    updated?: FirebaseFirestore.Timestamp
  }

  export type Fund = {
    id: string
    name: string
    image: string
    description: string
    totalFunds: number
    donorIds: string[]
    currency: string
    campusIds: string[]
    suggestionAmounts: number[]
    organizationId: stirng
    status: 'active' | 'inactive'
    created: FirebaseFirestore.Timestamp
    updated: FirebaseFirestore.Timestamp
    createBy?: string
    updateBy?: string
  }
}
