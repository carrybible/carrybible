import { Timestamp } from 'firebase/firestore'

type TransactionDetails = {
  transactionObj: any
}

export enum DonationType {
  campaign = 'campaign',
  fund = 'fund',
}

export type Donation = {
  id: string
  uid: string
  campusId?: string
  groupId?: string
  campaignId?: string
  fundId?: string
  organisationId: string
  transactionDetails: TransactionDetails
  type: DonationType
  amount: number
  currency: string
  paidAt: Timestamp
  created: Timestamp
}
