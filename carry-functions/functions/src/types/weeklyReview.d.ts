import { GroupActionsType } from './groupAction'

type WeeklyReview = {
  id: string
  startTime: FirebaseFirestore.Timestamp
  endTime: FirebaseFirestore.Timestamp
}

type MemberWeeklyReview = {
  uid: string
  groupActions?: {
    id: string
    type: GroupActionsType
  }[]
  messages?: string[]
  streakGains?: number[]
  scores?: number[]
}
