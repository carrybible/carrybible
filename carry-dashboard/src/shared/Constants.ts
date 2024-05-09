// value of timeZone is offset
export const groupTimeZone = [
  {
    key: '1',
    label: '(UTC-11) Pacific/Midway',
    value: '11',
  },
  {
    key: 2,
    label: '(UTC-10) Pacific/Honolulu',
    value: '10',
  },
  {
    key: '3',
    label: '(UTC-9) America/Anchorage',
    value: '9',
  },
  {
    key: '4',
    label: '(UTC-8) America/Los Angeles',
    value: '8',
  },
  {
    key: '5',
    label: '(UTC-7) America/Denver',
    value: '7',
  },
  {
    key: '6',
    label: '(UTC-6) America/Chicago',
    value: '6',
  },
  {
    key: '7',
    label: '(UTC-5) America/New York',
    value: '5',
  },
  {
    key: '8',
    label: '(UTC-4) America/Puerto Rico',
    value: '4',
  },
  {
    key: '9',
    label: '(UTC-3) America/Sao Paulo',
    value: '3',
  },
  {
    key: '10',
    label: '(UTC+0) Europe/London',
    value: '0',
  },
  {
    key: '11',
    label: '(UTC+1) Europe/Amsterdam',
    value: '-1',
  },
  {
    key: '12',
    label: '(UTC+2) Europe/Athens',
    value: '-2',
  },
  {
    key: '13',
    label: '(UTC+3) Europe/Moscow',
    value: '-3',
  },
  {
    key: '14',
    label: '(UTC+4) Asia/Dubai',
    value: '-4',
  },
  {
    key: '15',
    label: '(UTC+5) Indian/Maldives',
    value: '-5',
  },
  {
    key: '16',
    label: '(UTC+7) Asia/Ho Chi Minh',
    value: '-7',
  },
  {
    key: '17',
    label: '(UTC+8) Asia/Hong Kong',
    value: '-8',
  },
  {
    key: '18',
    label: '(UTC+8) Australia/Perth',
    value: '-8',
  },
  {
    key: '19',
    label: '(UTC+9) Asia/Seoul',
    value: '-9',
  },
  {
    key: '20',
    label: '(UTC+9) Asia/Tokyo',
    value: '-9',
  },
  {
    key: '21',
    label: '(UTC+9:30) Australia/Adelaide',
    value: '-9.5',
  },
  {
    key: '22',
    label: '(UTC+10) Australia/Sydney',
    value: '-10',
  },
  {
    key: '23',
    label: '(UTC+12) Pacific/Auckland',
    value: '-12',
  },
]

export const inviteRoles = [
  {
    key: '1',
    label: 'Campus User',
    value: 'campus-user',
  },
  {
    key: '2',
    label: 'Campus Leader',
    value: 'campus-leader',
  },
  {
    key: '3',
    label: 'Admin',
    value: 'admin',
  },
]

export const inviteCampusRole = [
  {
    key: '1',
    label: 'Can view',
    value: 'view',
  },
  {
    key: '2',
    label: 'Can edit',
    value: 'edit',
  },
]

export type PlanTypeTable = 'all' | 'feature' | 'template'
export const PLAN_TYPE_TABLE = {
  ALL: 'all' as PlanTypeTable,
  FEATURE: 'feature' as PlanTypeTable,
  TEMPLATE: 'template' as PlanTypeTable,
}

// Just temporary, need to use own default avatar
export const DEFAULT_USER_AVATAR = ''

export const ROLE_BASE = {
  MEMBER: 'member',
  LEADER: 'leader',
  CAMPUSLEADER: 'campus-leader',
  CAMPUSUSER: 'campus-user',
  OWNER: 'owner',
  ADMIN: 'admin',
}

export const LIMIT_IN_PROFILE = 5
