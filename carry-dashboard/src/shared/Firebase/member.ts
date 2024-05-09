import { User } from '@dts/User'
import Firebase from '@shared/Firebase/index'
import { doc, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { isNil, omitBy } from 'lodash'

export type MemberDataType = {
  uid: string
  name: string
  image: string
  joinDate?: string
  organisation: {
    id?: string
    role: string
  }
  permissions?: string[]
}

type GetMembersResponseType = {
  success: boolean
  message?: string
  total: number
  page: number
  limit: number
  data: MemberDataType[]
}

export type MembersScopeType = 'organisation' | 'group' | 'campus'

export const getMembers = async ({
  search,
  page,
  limit,
  scope,
  scopeId,
  orders,
}: {
  search?: string
  page: number
  limit: number
  scope: MembersScopeType
  scopeId: string
  orders?: { key: 'name' | 'role' | 'joined'; order: 'asc' | 'desc' }[]
}): Promise<GetMembersResponseType> => {
  const funcGetMembers = httpsCallable(Firebase.functions, 'func_get_members')
  const result = await funcGetMembers({
    search,
    page,
    limit,
    scope,
    scopeId,
    orders,
  })
  return result.data as GetMembersResponseType
}

type ExportMembersResponseType = {
  success: boolean
  message?: string
  data: {
    urlDownload: string
  }
}

export const exportMembers = async ({
  scope,
  scopeId,
}: {
  scope: MembersScopeType
  scopeId: string
}): Promise<ExportMembersResponseType> => {
  const funcExportMembers = httpsCallable(
    Firebase.functions,
    'func_export_members'
  )
  const result = await funcExportMembers({
    scope,
    scopeId,
  })
  return result.data as ExportMembersResponseType
}

export type MemberProfileType = {
  address?: string
  uid: string
  permissions: string[]
  name: string
  email: string
  image: string
  organisation: {
    id: string
    name: string
    image: string
    role: string
    campus?: {
      id: string
      name: string
      city: string
      state: string
      country: string
      region: string
    }
  }
  phoneNumber: string
  state: string
  city: string
  country: string
  region: string
  groups: {
    id: string
    name: string
    role:
      | 'leader'
      | 'member'
      | 'campus-leader'
      | 'campus-owner'
      | 'admin'
      | 'owner'
    image: string
  }[]
}

type GetMemberProfileResponseType = {
  success: boolean
  message?: string
  data: MemberProfileType
}

export const getMemberProfile = async ({
  uid,
}: {
  uid: string
}): Promise<GetMemberProfileResponseType> => {
  const funcGetProfile = httpsCallable(Firebase.functions, 'func_get_profile')
  const result = await funcGetProfile({
    uid,
  })
  // @ts-ignore
  if (result.data.data) {
    // @ts-ignore
    result.data.data.organisation = result.data.data.orgnisation
  }
  return result.data as GetMemberProfileResponseType
}

export const updateMemberProfile = async (
  userId: string,
  newUserInfo: Partial<User>
): Promise<{ success: boolean; message?: string }> => {
  try {
    const currentUserId = Firebase.auth.currentUser?.uid
    if (currentUserId !== userId) {
      return {
        success: false,
        message: 'member.can-only-update-your-profile',
      }
    }

    const userRef = doc(Firebase.firestore, Firebase.collections.USERS, userId)
    await setDoc(userRef, omitBy(newUserInfo, isNil), { merge: true })
    return {
      success: true,
    }
  } catch (e) {
    console.log(e)
    return { success: false, message: 'member.cant-update-user' }
  }
}

export const findMembers = async ({
  searchText,
  ignoreExistUser,
}: {
  searchText: string
  ignoreExistUser?: boolean
}): Promise<User[]> => {
  const funcFindMembers = httpsCallable(Firebase.functions, 'func_find_member')
  const result = (await funcFindMembers({
    search: searchText,
    ignoreExistUser: ignoreExistUser,
  })) as any
  if (result.data.success) {
    return result.data.data as User[]
  }
  return []
}

export const getDashboardUsers = async ({
  search,
  page,
  limit,
  orders,
}: {
  search?: string
  page: number
  limit: number
  orders?: { key: 'name' | 'role' | 'dashboardAccess'; order: 'asc' | 'desc' }[]
}): Promise<GetMembersResponseType> => {
  const funcGetDashboardUsers = httpsCallable(
    Firebase.functions,
    'func_get_members_campus'
  )
  const result = await funcGetDashboardUsers({
    search,
    page,
    limit,
    orders,
  })
  return result.data as GetMembersResponseType
}

export const deleteMember = async (
  userId: string,
  userInfo: User
): Promise<{ success: boolean; message?: string; errorCode?: number }> => {
  try {
    const accessRoles = ['admin', 'owner']
    if (accessRoles.includes(userInfo?.organisation?.role ?? '')) {
      const funcDeleteMember = httpsCallable(
        Firebase.functions,
        'func_delete_member'
      )
      const result = await funcDeleteMember({
        userId,
      })
      return result.data as {
        success: boolean
        message?: string
        errorCode?: number
      }
    }

    return {
      success: true,
    }
  } catch (e) {
    return { success: false, message: 'member.cant-update-user' }
  }
}

export const deleteMemberAccess = async (
  userId: string,
  userInfo: User
): Promise<{ success: boolean; message?: string }> => {
  try {
    const accessRoles = ['admin', 'owner']
    if (accessRoles.includes(userInfo?.organisation?.role ?? '')) {
      const funcDeleteMemberAccess = httpsCallable(
        Firebase.functions,
        'func_delete_member_access'
      )
      const result = await funcDeleteMemberAccess({
        userId,
      })
      return result.data as {
        success: boolean
        message?: string
      }
    }

    return {
      success: true,
    }
  } catch (e) {
    console.log(e)
    return { success: false, message: 'member.cant-update-user' }
  }
}

export const changeRoleAccess = async (
  userId: string,
  role: string,
  userInfo: User
): Promise<{ success: boolean; message?: string }> => {
  try {
    const accessRoles = ['admin', 'owner']
    if (accessRoles.includes(userInfo?.organisation?.role ?? '')) {
      const funcChangeRoleAccess = httpsCallable(
        Firebase.functions,
        'func_change_role_access'
      )
      const result = await funcChangeRoleAccess({
        userId,
        role,
      })
      return result.data as {
        success: boolean
        message?: string
      }
    }

    return {
      success: true,
    }
  } catch (e) {
    console.log(e)
    return { success: false, message: 'member.cant-update-user' }
  }
}
