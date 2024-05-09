declare namespace Request {
  type inviteRequest = {
    uids?: string[]
    emails?: string[]
    role?: 'leader' | 'campus-leader' | 'admin' | 'member' | 'owner'
    target: {
      type: 'create-group' | 'add-dashboard-user'
      details: {
        name?: string
        campusId?: string
        timeZone?: string
        imageUrl?: string
      }
    }
    customDomain?: string
    isProduction?: boolean
  }

  type CampaignRequestModel = {
    image: string
    name: string
    description: string
    goal: number
    currency: string
    suggestions: number[]
  }

  type FundRequestModel = {
    image: string
    name: string
    description: string
    currency: string
    campusIds: string[]
    suggestions: number[]
  }

  type CampaignUpdateRequestModel = {
    id: string
    image?: string
    name?: string
    description?: string
    goal?: number
    currency?: string
    suggestions?: number[]
    endDate?: string
  }

  type FundUpdateRequestModel = {
    id: string
    image?: string
    name?: string
    description?: string
    currency?: string
    campusIds?: string[]
    suggestions?: number[]
  }

  type CampainVideoRequestModel = {
    title: string
    url: string
    thumbnail?: string
    videoOption: 'youtube' | 'web'
    description?: string
  }

  type DonationRequestModel = {
    scope: 'user' | 'group' | 'campus'
    page: number
    limit: number
    search?: string
    sort?: {
      key: 'name' | 'amount' | 'date' | 'leader' | 'group'
      order: 'asc' | 'desc'
    }
    filters?: {
      campusId?: string
      campaignId?: string
      fundId?: string
    }
  }

  type DonationExportRequestModel = {
    search?: string
    filters?: {
      campusId?: string
      campaignId?: string
      fundId?: string
    }
  }
}
