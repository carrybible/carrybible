import Firebase from '@shared/Firebase/index'
import { httpsCallable } from 'firebase/functions'

export type ReportType = {
  totalMember: number
  totalGroup: number
  memberGrowth?: { [day: string]: number }
  totalMessage: number
  totalMinute: number
  totalGratitude: number
  totalPrayer?: number
  increaseUserPercent: number
  increaseGroup: number
  dailyStreak: number
  prayerUsers?: BasicUserType[]
  gratitudeUsers?: BasicUserType[]
  messageUsers?: BasicUserType[]
}

export type BasicUserType = {
  uid: string
  name: string
}

type GetReportResponseType = {
  success: boolean
  data: ReportType
  message?: string
}

export const getReport = async ({
  scope,
  scopeId,
}: {
  scope: 'organisation' | 'campus' | 'group' | 'user'
  scopeId: string
}): Promise<GetReportResponseType> => {
  const funcGetReport = httpsCallable(Firebase.functions, 'func_get_reports')
  const {
    data: { data, success },
  } = (await funcGetReport({
    scope,
    scopeId,
  })) as { data: { data: ReportType; success: boolean } }
  return { success, data }
}
