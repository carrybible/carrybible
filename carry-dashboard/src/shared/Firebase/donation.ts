import Firebase from '@shared/Firebase/index'
import { httpsCallable } from 'firebase/functions'

export type DonationDataType = {
  id: string
  name: string
  image: string
  amount: number
  currency: string
  paidAt: string
}

type GetDonationsResponseType = {
  success: boolean
  message?: string
  total: number
  page: number
  limit: number
  data: DonationDataType[]
}

export type GivingHistoryDataType = {
  id: string
  type: 'campaign' | 'fund'
  name: string
  image: string
  amount: number
  currency: string
  lastPaidAt: string
}

export type GivingHistoryResponseType = {
  success: boolean
  message?: string
  data: GivingHistoryDataType[]
}

export const getDonations = async ({
  search,
  page,
  limit,
  campaignId,
  fundId,
  campusId,
  orders,
}: {
  search?: string
  page: number
  limit: number
  campaignId?: string
  fundId?: string
  campusId?: string
  orders?: { key: 'name' | 'amount' | 'date'; order: 'asc' | 'desc' }
}): Promise<GetDonationsResponseType> => {
  const funcGetDonations = httpsCallable(
    Firebase.functions,
    'func_get_donations'
  )
  const result = await funcGetDonations({
    scope: 'user',
    page,
    limit,
    search,
    sort: orders,
    filters: {
      campusId: campusId,
      campaignId: campaignId,
      fundId: fundId,
    },
  })
  return result.data as GetDonationsResponseType
}

export const exportDonation = async ({
  campaignId,
  fundId,
}: {
  campaignId?: string
  fundId?: string
}): Promise<{
  data: {
    urlDownload: string
  }
}> => {
  const funcExportDonations = httpsCallable(
    Firebase.functions,
    'func_export_donation'
  )
  const result = await funcExportDonations({
    filters: {
      campaignId: campaignId,
      fundId: fundId,
    },
  })
  return result.data as {
    data: {
      urlDownload: string
    }
  }
}

export const getDonationOfUser = async ({
  userId,
  orders,
}: {
  userId: string
  orders?: { key: 'name' | 'amount' | 'date'; order: 'asc' | 'desc' }
}): Promise<GivingHistoryResponseType> => {
  const funcGetDonations = httpsCallable(
    Firebase.functions,
    'func_get_user_donation_history'
  )
  const result = await funcGetDonations({
    id: userId,
    sort: orders,
  })
  return result.data as GivingHistoryResponseType
}
