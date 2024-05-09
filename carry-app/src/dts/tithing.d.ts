export interface Tithing {
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
}
