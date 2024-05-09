import { Timestamp } from 'firebase/firestore'

export type ActiveGoal = {
  id: string
  startDate: Timestamp
  endDate?: Timestamp
  status?: string
  studyType?: string
  pace?: string
}

export type SocialMediaPost = {
  id: string
  groupStudyPlanId: string
  orgStudyPlanId: string
  renderId: string
  studyName: string
  thumbnail: string
  videoId: string
  videoUrl: string
}
