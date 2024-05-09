import { Plan } from '@dts/Plans'
import Firebase from '@shared/Firebase/index'
import { ResponseType } from '@shared/Types/apiResponse'
import { getServerTimestamp } from '@shared/Utils'
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  DocumentReference,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { GroupDetailType } from './group'

type GetMembersResponseType = {
  success: boolean
  message?: string
  total: number
  data: Plan[]
  haveTemplate?: boolean
}

export const updateOrgPlan = async ({
  plan,
  organisationId,
}: {
  organisationId: string
  plan: Partial<Plan> & { id: string }
}) => {
  const planRef = doc(
    Firebase.firestore,
    Firebase.collections.ORGANISATIONS,
    organisationId,
    Firebase.collections.ORG_PLANS,
    plan.id
  ) as DocumentReference<Plan>

  try {
    await updateDoc(planRef, {
      ...plan,
      updated: getServerTimestamp(),
      lastUpdatedAuthor: Firebase.auth.currentUser?.uid,
    })
    return {
      success: true,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: 'plan.update-plan-failed',
    }
  }
}

export const createOrgPlan = async ({
  plan,
  organisationId,
}: {
  organisationId: string
  plan: Omit<Plan, 'id' | 'created' | 'updated' | 'markAsTemplate'>
}) => {
  const orgPlansRef = collection(
    Firebase.firestore,
    Firebase.collections.ORGANISATIONS,
    organisationId,
    Firebase.collections.ORG_PLANS
  )

  try {
    const planRef = await addDoc(orgPlansRef, {
      ...plan,
      updated: serverTimestamp(),
      created: serverTimestamp(),
      lastUpdatedAuthor: Firebase.auth.currentUser?.uid,
    })
    await updateDoc(planRef, {
      id: planRef.id,
    })
    return {
      success: true,
      data: {
        planId: planRef.id,
      },
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: 'plan.create-plan-failed',
    }
  }
}

export const applyStudyPlanToGroup = async (
  groupId: string,
  userPlan: Plan,
  startDate: Date
): Promise<Plan | undefined> => {
  try {
    const request = httpsCallable(
      Firebase.functions,
      'v2_func_apply_plan_to_group'
    )
    const response = (await request({
      groupId,
      userPlan,
      startDate: startDate.getTime(),
    })) as any

    if (response.data.success) {
      return response.data.data as Plan
    } else {
      return undefined
    }
  } catch (error) {
    return undefined
  }
}

export const checkOverlapPlans = async (
  groupId: string,
  startDate: number,
  duration: number,
  pace: string
): Promise<any> => {
  const request = httpsCallable(Firebase.functions, 'func_check_overlap_plans')
  const response = (await request({
    groupId,
    startDate,
    duration,
    pace,
  })) as any

  if (response.data.success) {
    return response.data
  } else {
    return false
  }
}

export const publishOrgPlanToGroup = async (
  orgId: string,
  orgPlanId: string,
  planInstanceId: string,
  groupId: string,
  plan: Plan,
  startDate: Date,
  group: GroupDetailType
): Promise<{ success: boolean; message?: string }> => {
  try {
    await setDoc(
      doc(
        Firebase.firestore,
        Firebase.collections.ORGANISATIONS,
        orgId,
        Firebase.collections.ORG_PLANS,
        orgPlanId,
        Firebase.collections.PUBLISHED_GROUPS,
        `${planInstanceId}-${orgPlanId}`
      ),
      {
        planInstanceId,
        groupId,
        created: getServerTimestamp(),
        updated: getServerTimestamp(),
        planId: orgPlanId,
        name: group.name,
        duration: plan.duration,
        pace: plan.pace,
        startDate,
        image: group.image,
      }
    )
    return { success: true }
  } catch (error) {
    return { success: false, message: 'can-not-add-to-group-using-this-plan' }
  }
}

export const getPlans = async ({
  campusId,
  search,
  orders,
  tab,
}: {
  campusId?: string
  search?: string
  orders?: { key: 'name' | 'length' | 'campus'; order: 'asc' | 'desc' }[]
  tab?: string
}): Promise<GetMembersResponseType> => {
  const func_get_plan = httpsCallable(Firebase.functions, 'func_get_plan')
  const result = await func_get_plan({
    campusId,
    search,
    orders,
    tab,
  })
  return result.data as GetMembersResponseType
}

export const deleteOrgPlan = async (organizationId: string, planId: string) => {
  try {
    const user = Firebase.auth.currentUser
    if (!user || !planId || !organizationId) {
      return false
    }

    const planRef = doc(
      Firebase.firestore,
      Firebase.collections.ORGANISATIONS,
      organizationId,
      Firebase.collections.ORG_PLANS,
      planId
    ) as DocumentReference<Plan>

    await deleteDoc(planRef)
    return true
  } catch (error) {
    return false
  }
}

export const generatePlanFromSermon = async (link: string) => {
  const func_get_plan = httpsCallable(
    Firebase.functions,
    'func_generate_plan_from_sermon'
  )
  const result = await func_get_plan({
    youTubeVideoUrl: link,
  })
  return result.data as ResponseType<{
    planId: string
    videoId: string
  }>
}
