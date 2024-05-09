declare namespace Response {
  type Result = {
    totalMember: number
    totalGroup: number
    memberGrowth: {}
    totalMessage: number
    totalMinute: number
    totalGratitude: number
    totalPrayer: number
    increaseUserPercent: number
    increaseGroup: number
  }
  interface Member {
    uid: string
    name: string
    organisation?: {
      id: string
      role: 'member' | 'leader' | 'campus-leader' | 'admin' | 'owner'
      campusId?: string
    }
    joinDate: any
    image: string
    permissions: string[]
  }
  interface MemberCampus {
    uid: string
    name: string
    organisation?: {
      id: string
      role: 'member' | 'leader' | 'campus-leader' | 'admin' | 'owner'
      campusId?: string
    }
    joinDate: any
    image: string
    permissions: string[]
    dashboardAccess: stirng
  }
  interface MemberExport {
    'User Name'?: string
    'User Location'?: string
    'Email Address'?: string
    'Phone Number'?: string
    Campus?: string
    'Current Daily Streak'?: number
    'Total Prayers'?: number
    'Total Gratitude Requests'?: number
    'Current Activity Status'?: string
    'Join Date'?: string
  }

  interface DonationExport {
    Donor?: string
    Tithings?: string
    Campaign?: string
    'Gift Amount'?: number
    Campus?: string
    Group?: string
    Date?: string
  }

  interface Campus {
    id: string
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
    groupCount: number
    permission: 'member' | 'leader'
  }
  interface MemberCampusAccess {
    campusId: string
    createById: string
    createBy: string
    name: stirng
    location: stirng
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
    created: Timestamp
    updated: Timestamp
    deleted?: Timestamp
    pace?: 'day' | 'week' | 'month'
    status?: 'ended' | 'normal' | 'future'
    startDate?: Timestamp
    markAsTemplate?: boolean
    shareWithMobile?: boolean
    baseOrgPlan?: string // rawId of template plan
    campusName?: string
  }

  export type CampaignModel = {
    id: string
    name: string
    image: string
    description: string
    goalAmount: number
    suggestionAmounts: number[]
    currency: string
    organization: {
      id: string
      name: string
    }
    campuses: {
      id: string
      name: string
      avatar: string
    }[]
    groups: {
      id: string
      name: string
      avatar: string
      campusId: string
    }[]
    video?: {
      title: string
      url: string
      thumbnail?: string
      type: 'youtube' | 'web'
      description?: string
    }
    totalFunds: number
    donorIds: string[]
    startDate?: string
    endDate?: string
    status: string
    totalDonation?: number
    totalFundsIncreasedPercent?: number
    totalDonorsIncrease?: number
  }

  export type FundModel = {
    id: string
    name: string
    image: string
    description: string
    suggestionAmounts: number[]
    currency: string
    organization: {
      id: string
      name: string
    }
    campuses: {
      id: string
      name: string
      avatar: string
    }[]
    totalFunds: number
    donorIds: string[]
    status: string
    totalFundsIncreasedPercent?: number
    totalDonorsIncrease?: number
  }

  export type ReportGiving = {
    totalFunds: number
    totalFundsIncreasedPercent: number
    totalDonors: number
    totalDonorsIncrease: number
    currency: string
    totalFundsOvertime: {
      [date: string]: number
    }
  }

  export type DonationOfUser = {
    id: string
    name: string
    image: string
    amount: number
    currency: string
    paidAt: string
  }

  export type DonationOfGroup = {
    id: string
    name: string
    image: string
    amount: number
    currency: string
    leader: {
      uid: string
      name: string
    }
  }

  export type DonationOfCampus = {
    id: string
    name: string
    image: string
    totalGroups: number
    amount: number
    currency: string
  }

  export type GivingResponse = {
    id: string
    type: 'campaign' | 'fund'
    name: string
    image: string
  }

  export type GivingHistory = {
    id: string
    type: 'campaign' | 'fund'
    name: string
    image: string
    amount: number
    currency: string
    lastPaidAt: string
  }

  export type DonationModel = {
    id: string
    uid: string
    campusId?: string
    groupId?: string
    campaignId?: string
    fundId?: string
    organisationId: string
    transactionDetails: {
      //Transaction object from Stripe
      transactionObj: any
    }
    type: 'campaign' | 'fund'
    amount: number
    currency: string
    paidAt: string
    created: string
  }

  export type CampusWithTithing = { id: string; name: string; image: string; fundId?: string; fundName?: string }
}
