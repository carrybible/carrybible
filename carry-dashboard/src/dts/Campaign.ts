import { Timestamp } from 'firebase/firestore'

import { Organisation } from '@dts/Organisation'
import { Group } from '@redux/slices/group'

export enum CampaignVideoType {
  youtube = 'youtube',
  web = 'web',
}

export type CampaignVideo = {
  videoOption: CampaignVideoType
  type?: CampaignVideoType
  title: string
  description: string
  thumbnail: string
  url: string
}

export type Campaign = {
  id: string
  image: string
  name: string
  description: string
  status: CampaignStatus
  organization: Organisation
  totalFunds: number
  donorIds: string[]
  goalAmount: number
  currency: string
  campusIds: string[]
  groupIds: string[]
  groups: ParticipatingGroup[]
  startDate?: Date | string
  endDate?: Date | string
  video?: CampaignVideo
  suggestionAmounts: number[]
  creatorUid: string
  updated: Timestamp
  created: Timestamp
  totalFundsIncreasedPercent?: number
  totalDonorsIncrease?: number
}

export enum CampaignStatus {
  all = '',
  active = 'active',
  draft = 'draft',
  ended = 'ended',
}

export type ParticipatingGroup = Group & {
  avatar: string
  fundsRaised: number
}
