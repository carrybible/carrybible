import { UserOrganisation } from '@dts/User'
import Firebase from '@shared/Firebase/index'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { isNil, omitBy } from 'lodash'

export type PermissionData = {
  permissions: string[]
  campusAccess: {
    id: string
    name: string
  }[]
  organisation?: UserOrganisation
  email?: string
  image?: string
  name?: string
  orgSyncStatus?: string
  streamToken?: string
  uid: string
}
export type DashboardAccountType = {
  success: boolean
  data: PermissionData
  isAuthen?: boolean
  message?: string
}

export type ResultAPIType = {
  success: boolean
  isAuthen?: boolean
  message?: string
}

export const fetchDashboardAccount = async (): Promise<
  DashboardAccountType['data']
> => {
  const funcDashboardAccount = httpsCallable<{}, DashboardAccountType>(
    Firebase.functions,
    'func_get_dashboard_account'
  )
  const result = await funcDashboardAccount({})
  const { success, message, data } = result.data

  if (!success) {
    throw new Error(message ?? 'fetch-dashboard-account-failed')
  }

  return data
}

export const updateDefaultOrganisation = async (
  organisationId: string
): Promise<ResultAPIType> => {
  const funcSetDefaultOrganisation = httpsCallable<
    { organisationId: string },
    ResultAPIType
  >(Firebase.functions, 'func_update_organisation_default')
  const result = await funcSetDefaultOrganisation({ organisationId })
  return result?.data
}

type UpdateDashboardOnboardingParams = {
  welcome?: boolean
  groupCreated?: boolean
  editPlan?: boolean
  addActivity?: boolean
  readySchedule?: boolean
  planPublished?: boolean
}

export const updateDashboardOnboarding = async (
  payload: UpdateDashboardOnboardingParams
): Promise<{ success: boolean; message?: string }> => {
  try {
    const user = Firebase.auth.currentUser
    if (!user || !payload) {
      return { success: false, message: '' }
    }
    const userRef = doc(
      Firebase.firestore,
      Firebase.collections.USERS,
      user.uid
    )

    const userData = (await getDoc(userRef)).data()
    const dashboardOnboarding = {
      welcome: false,
      groupCreated: false,
      editPlan: false,
      addActivity: false,
      readySchedule: false,
      planPublished: false,
    }

    await updateDoc(userRef, {
      ...userData,
      dashboardOnboarding: {
        ...(userData?.dashboardOnboarding ?? dashboardOnboarding),
        ...omitBy(payload, isNil),
      },
    })
    return { success: true }
  } catch (error) {
    return { success: false, message: 'groups.failed-update-group' }
  }
}

export const updateOrganisationDetails = async (
  organisationId: string,
  image: string,
  name: string
): Promise<ResultAPIType> => {
  const funcUpdateOrganisationDetails = httpsCallable<
    { organisationId: string; image?: string; name: string },
    ResultAPIType
  >(Firebase.functions, 'func_update_organisation_details')
  const result = await funcUpdateOrganisationDetails({
    organisationId,
    image,
    name,
  })
  return result?.data
}
