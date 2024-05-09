import Firebase from '@shared/Firebase/index'

import { httpsCallable } from 'firebase/functions'

export type Campus = {
  id?: string
  name?: string
  image?: string
  city?: string
  state?: string
  country?: string
  region?: string
  organisationId?: string
  owner?: string
  groupCount?: number
  permission?: 'member' | 'leader'
  avatar?: string
}

type GetCampusesResponseType = {
  success: boolean
  message?: string
  total: number
  page: number
  limit: number
  data: Campus[]
}

export const getCampuses = async ({
  organisationId,
  search,
  page,
  limit,
  orders,
}: {
  organisationId: string
  search?: string
  page: number
  limit?: number
  orders?: {
    key: 'church' | 'groupCount' | 'location'
    order: 'asc' | 'desc'
  }[]
}): Promise<GetCampusesResponseType> => {
  const funcGetCampuses = httpsCallable(Firebase.functions, 'func_get_campus')
  const payload = {
    organisationId,
    search,
    page,
    limit,
    orders,
  }
  const result = await funcGetCampuses(payload)
  return result.data as GetCampusesResponseType
}

export type CreateCampusResp = {
  success: boolean
  isAuthen?: boolean
  message?: string
}

export const createCampus = async (info: Campus) => {
  try {
    const funcCreateCampus = httpsCallable(
      Firebase.functions,
      'func_create_campus'
    )
    const { data } = (await funcCreateCampus(info)) as any
    return data as CreateCampusResp
  } catch (error) {
    return { success: false, message: 'can-not-create-campus' }
  }
}

export const updateCampus = async (info: Campus) => {
  try {
    const funcUpdateCampus = httpsCallable(
      Firebase.functions,
      'func_update_campus'
    )
    const { data } = (await funcUpdateCampus(info)) as any
    return data as CreateCampusResp
  } catch (error) {
    return { success: false, message: 'can-not-update-campus' }
  }
}

export type GetCampusAccessesReponseType = {
  campusId: string
  permission: 'view' | 'edit'
  createById: string
  createBy: string
  name: string
  location: string
}

export type CampusAccess = {
  campusId: string
  createBy: string
  createById: string
  location: string
  name: string
  permission: string
}

type GetCampusAccessesResponseType = {
  success: boolean
  message?: string
  total: number
  page: number
  limit: number
  data: CampusAccess[]
}

export const getCampusAccesses = async ({
  userId,
  search,
  page,
  limit,
  orders,
}: {
  userId: string
  search?: string
  page: number
  limit: number
  orders?: { key: 'campus' | 'location' | 'addBy'; order: 'asc' | 'desc' }[]
}): Promise<GetCampusAccessesResponseType> => {
  const funcGetCampusAccesses = httpsCallable(
    Firebase.functions,
    'func_get_campus_access'
  )
  const payload = {
    userId,
    search,
    page,
    limit,
    orders,
  }
  const result = await funcGetCampusAccesses(payload)
  return result.data as GetCampusAccessesResponseType
}

export const updateCampusAccess = async (info: {
  permission: 'view' | 'edit'
  campusId: string
  userId: string
}) => {
  try {
    const funcUpdateCampusAccess = httpsCallable(
      Firebase.functions,
      'func_create_campus_access'
    )
    const { data } = (await funcUpdateCampusAccess(info)) as any
    return data as CreateCampusResp
  } catch (error) {
    return { success: false, message: 'can-not-update-campus' }
  }
}
