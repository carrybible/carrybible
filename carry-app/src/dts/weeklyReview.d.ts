import GroupActions, { GroupActionsType } from '@dts/groupAction'

type GroupActionStat = {
  [type in GroupActionsType]: number
}

type GroupStats = {
  totalGroupActions: GroupActionStat
  totalMessages: number
  totalEngagedMembers: number
  keyContributor?: { uid: string; score: number }[]
}

type UserStats = {
  totalGroupActions: GroupActionStat
  totalMessages: number
  streakGain: number
  mostReactedGratitude?: GroupActions
}

export type WeeklyReview = {
  groupStats?: GroupStats
  userStats?: UserStats
}
