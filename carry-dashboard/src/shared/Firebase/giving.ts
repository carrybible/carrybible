import Firebase from '@shared/Firebase/index'
import { message } from 'antd'
import { httpsCallable } from 'firebase/functions'
import { ResponseType } from '../Types/apiResponse'

export type TithingFundCreate = {
  image?: string
  name?: string
  description?: string
  currency?: string
  campusIds?: string[]
  suggestions?: number[]
  status?: 'active' | 'inactive'
}

export type CampusBlockType = {
  id: string
  name: string
  avatar: string
}

export type DonationOfUser = {
  id: string
  name: string
  image: string
  amount: number
  currency: string
  paidAt: string
}

export type DonationOfGroup = {
  id: string
  name: string
  image: string
  amount: number
  currency: string
  leader: {
    uid: string
    name: string
  }
}

export type DonationOfCampus = {
  id: string
  name: string
  image: string
  totalGroups: number
  amount: number
  currency: string
}

export type GetFundsType = {
  search?: string | null
  page?: number
  limit?: number
  status?: 'active' | 'inactive' | null
  campusId?: string
  sort?: {
    key: 'name' | 'goal'
    order: 'asc' | 'desc'
  }
}

export type GetDonationType = {
  scope?: 'user' | 'group' | 'campus'
  page?: number
  limit?: number
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

export type AccountLink = {
  object: string
  created: number
  expires_at: number
  url: string
}

export type ParticipatingCampuses = {
  id: string
  name: string
  amount: number
  currency: string
  image: string
  totalGroups: number
}

type GetGivingResponseType = {
  success: boolean
  message?: string
  data: GivingResponse[]
}

export type GivingResponse = {
  id: string
  type: 'campaign' | 'fund'
  name: string
  image: string
}

export type CampusWithTithing = {
  id: string
  name: string
  image: string
  fundId?: string
  fundName?: string
}

export const createTithingFund = async ({
  fund,
}: {
  fund: Omit<TithingFundCreate, 'id' | 'created' | 'updated'>
}) => {
  try {
    const funcCreateTithingFund = httpsCallable(
      Firebase.functions,
      'func_create_tithing'
    )
    const { data } = (await funcCreateTithingFund(fund)) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-create-fund' }
  }
}

export const updateTithingFun = async ({
  fund,
}: {
  fund: Partial<TithingFundCreate> & { id: string }
}) => {
  try {
    const funcUpdateTithingFund = httpsCallable(
      Firebase.functions,
      'func_update_tithing'
    )
    const { data } = (await funcUpdateTithingFund(fund)) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-update-fund' }
  }
}

export const getTithingFunds = async (filter: GetFundsType) => {
  const defaultFilter = {
    search: '',
    page: 1,
    limit: 20,
    sort: {
      key: 'name',
      order: 'asc',
    },
    status: 'active',
  }
  try {
    const funcGetTithingFunds = httpsCallable(
      Firebase.functions,
      'func_get_tithings'
    )
    const { data } = (await funcGetTithingFunds({
      ...defaultFilter,
      ...filter,
    })) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-get-funds' }
  }
}

export const getGivingOverviewReport = async () => {
  try {
    const funcGivingOverviewReport = httpsCallable(
      Firebase.functions,
      'func_get_giving_reports'
    )
    const { data } = (await funcGivingOverviewReport()) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-get-giving-overview-report' }
  }
}

export const getTithingFundDetail = async (fundId: string) => {
  try {
    const func = httpsCallable(Firebase.functions, 'func_get_tithing_details')
    const { data } = (await func({ id: fundId })) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-get-tithing-fund-detail' }
  }
}

export const getTithingDonations = async (filter: GetDonationType) => {
  const defaultFilter = {
    scope: 'user',
    search: '',
    page: 1,
    limit: 5,
    sort: {
      key: 'amount',
      order: 'desc',
    },
  }
  try {
    const funcGetTithingDonations = httpsCallable(
      Firebase.functions,
      'func_get_donations'
    )
    const { data } = (await funcGetTithingDonations({
      ...defaultFilter,
      ...filter,
    })) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-get-fund-donations' }
  }
}

export const getParticipatingCampuses = async (fundId: string) => {
  try {
    const func = httpsCallable(Firebase.functions, '')
    const { data } = (await func({ id: fundId })) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-get-participating-campuses' }
  }
}

export const getGiving = async () => {
  try {
    const fundGetGiving = httpsCallable(
      Firebase.functions,
      'func_search_giving'
    )
    const { data } = (await fundGetGiving()).data as GetGivingResponseType
    return data
  } catch (error) {
    return []
  }
}

export const updateStatusTithingFund = async ({
  fund,
}: {
  fund: { id: string; status: 'active' | 'inactive' }
}) => {
  try {
    const funcUpdateStatusTithingFund = httpsCallable(
      Firebase.functions,
      'func_change_tithing_status'
    )
    const { data } = (await funcUpdateStatusTithingFund(fund)) as any
    return data
  } catch (error) {
    return { success: false, message: 'can-not-update-fund-status' }
  }
}

export const getCampusAssigned = async () => {
  try {
    const getCampusAssigned = httpsCallable(
      Firebase.functions,
      'func_get_campuses_with_tithing'
    )
    const { data } = (await getCampusAssigned()).data as ResponseType<
      CampusWithTithing[]
    >
    return data
  } catch (error) {
    return []
  }
}

export const connectStripe: (params: {
  linkExpired: boolean
  refreshUrl: string
  returnUrl: string
}) => Promise<AccountLink | null> = async (params) => {
  try {
    const connectStripe = httpsCallable(
      Firebase.functions,
      'func_connect_stripe'
    )
    const response = (await connectStripe(params))
      .data as ResponseType<AccountLink>
    if (!response.success) throw response.message
    return response.data
  } catch (error) {
    message.error('Connect to Stripe failed. Please try again or contact Admin')
  }
  return null
}

export const checkConnectStripe: () => Promise<{
  status: string
} | null> = async () => {
  try {
    const checkConnectStripe = httpsCallable(
      Firebase.functions,
      'func_check_connect_stripe'
    )
    const response = (await checkConnectStripe()).data as ResponseType<{
      status: string
    }>
    if (!response.success) throw response.message
    return response.data
  } catch (error) {
    console.log('Connect to Stripe failed. Please try again or contact Admin')
  }
  return null
}
