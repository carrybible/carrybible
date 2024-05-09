import { Timestamp } from 'firebase/firestore'

export type TithingFund = {
  id: string
  name: string
  image: string
  description: string
  totalFunds: number
  donorIds: string[]
  currency: string
  campusIds: string[]
  suggestionAmounts: number[]
  organizationId: string
  organization: {
    id: string
    name: string
  }
  status: 'active' | 'inactive'
  created: Timestamp
  updated: Timestamp
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
    transactionObj: any
  }
  type: 'campaign' | 'fund'
  amount: number
  currency: string
  email?: string
  paidAt: Date
  created: Date
  updated?: Date
}

export type TithingFundDetail = {
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
  totalDonorsIncrease: number
  totalFundsIncreasedPercent: number
}
