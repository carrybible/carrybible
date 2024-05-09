export interface Campaign {
  id: string
  name: string
  image: string
  description: string
  goalAmount: number
  suggestionAmounts: number[]
  totalDonation?: number
  currency: string
  organizationId: string
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
  }[]
  video?: {
    title: string
    url: string
    thumbnail?: string
    type: 'youtube' | 'web'
    description?: string
    videoOption?: string
  }
  totalFunds: number
  donorIds: string[]
  startDate?: Date
  endDate?: Date
  status: 'active' | 'ended' | 'draft'
}
