import { appCheck } from 'firebase-admin'

export const SERVER_TIMEZONE_STRING = 'America/New_York'
export const DURATION_DAY = 'day'
export const DURATION_WEEK = 'week'
export const APPLE_SHARED_KEY = ''
export const isDev = appCheck().app.options.projectId === 'carry-dev'

export const REMIND_DAILY_CONFIG = [
  {
    minMemberTotal: 3,
    maxMemberTotalMemberTotal: 6,
    requireCompletedTotal: 2,
    message: 'text.remind-daily-3',
  },
  {
    minMemberTotal: 7,
    maxMemberTotalMemberTotal: 12,
    requireCompletedTotal: 3,
    message: 'text.remind-daily-7',
  },
  {
    minMemberTotal: 13,
    maxMemberTotalMemberTotal: 20,
    requireCompletedTotal: 4,
    message: 'text.remind-daily-13',
  },
  {
    minMemberTotal: 21,
    maxMemberTotalMemberTotal: 30,
    requireCompletedTotal: 5,
    message: 'text.remind-daily-21',
  },
  {
    minMemberTotal: 31,
    maxMemberTotalMemberTotal: 50,
    requireCompletedTotal: 6,
    message: 'text.remind-daily-31',
  },
  {
    minMemberTotal: 51,
    maxMemberTotalMemberTotal: 100,
    requireCompletedTotal: 7,
    message: 'text.remind-daily-51',
  },
  {
    minMemberTotal: 100,
    maxMemberTotalMemberTotal: 999,
    requireCompletedTotal: 8,
    message: 'text.remind-daily-100',
  },
]

export const SCOPES = ['organisation', 'campus', 'group', 'member']
export const SCOPE = {
  GROUP: 'group',
  ORGANISATION: 'organisation',
  CAMPUS: 'campus',
  MEMBER: 'member',
  DASHBOARD: 'dashboard',
  USER: 'user',
}

type roles = 'member' | 'leader' | 'campus-leader' | 'campus-user' | 'admin' | 'owner'
export const ROLE_BASE = {
  MEMBER: 'member' as roles,
  LEADER: 'leader' as roles,
  CAMPUSLEADER: 'campus-leader' as roles,
  CAMPUSUSER: 'campus-user' as roles,
  OWNER: 'owner' as roles,
  ADMIN: 'admin' as roles,
}

export const INVITE_TYPE = {
  CREATE_GROUP: 'create-group',
  ADD_DASHBOARD_USER: 'add-dashboard-user',
}

export const UNSPLASH_CONFIG = {
  CLIENT_IT: '',
}

export const MESSAGE_RESPONSE = {
  UAUTHEN: "Hmm, it looks like you don't have permission to access this page 🔒",
}

export const CAMPUSACCESS = {
  ALLACCESS: 'All campuses',
}

export const DEFAULT_USER_AVATAR = ''

export const SPECIAL_ORGANISATION = {
  WE_CHURCH: isDev ? '' : '',
}

export const MASTER_ROLES = ['admin', 'owner']

type CampaignStatus = 'draft' | 'active' | 'ended'
export const CAMPAIGNSTATUS = {
  DRAFT: 'draft' as CampaignStatus,
  ACTIVE: 'active' as CampaignStatus,
  ENDED: 'ended' as CampaignStatus,
}

type FundStatus = 'active' | 'inactive'
export const FUNDSTATUS = {
  ACTIVE: 'active' as FundStatus,
  INACTIVE: 'inactive' as FundStatus,
}

type DonationType = 'campaign' | 'tithing'
export const DONATION_TYPE = {
  TITHING: 'tithing' as DonationType,
  CAMPAIGN: 'campaign' as DonationType,
}

type VideoOptionType = 'youtube' | 'web'
export const VIDEO_OPTION_TYPE = {
  YOUTUBE: 'youtube' as VideoOptionType,
  WEB: 'web' as VideoOptionType,
}
