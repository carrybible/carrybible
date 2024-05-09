import { createContext } from 'react'
import { StudyPlan } from '@dts/study'

export const StudyPreviewContext = createContext<{
  loading?: boolean
  groupId?: string
  plan?: StudyPlan.GroupPlan
  blockIndex: number
  completedMembers?: string[]
  progress?: { [bIndex: string]: StudyPlan.UserProgress }
  groupMembers?: any
  channel?: any
  inOnboardingFlow?: boolean
  showIntro?: boolean
  initTab?: number
}>({ blockIndex: 0 })
