import Config from '@shared/Config'
import axios from 'axios'
import Firebase from '@shared/Firebase/index'
import { httpsCallable } from 'firebase/functions'

export const verifyInviteToken = async ({
  accessToken,
}: {
  accessToken: string
}): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.post(`${Config.SERVER}/func_verify_invite`, {
    accessToken,
  })

  return response.data
}

type InviteDashboardParams = {
  emails?: string[]
  uids?: string[]
  role: 'campus-user' | 'campus-leader' | 'admin'
  campusId?: string
}

export type InviteDashboardResp = {
  success: boolean
  isAuthen?: boolean
  message?: string
}

export const inviteToDashboard = async (
  info: InviteDashboardParams & any
): Promise<InviteDashboardResp> => {
  try {
    const user = Firebase.auth.currentUser

    if (!user || (!info.emails?.length && !info.uids?.length)) {
      return { success: false, message: info.t('user-not-found') }
    }

    const funcSendInvite = httpsCallable(Firebase.functions, 'func_send_invite')
    const payload = {
      uids: info.uids,
      emails: info.emails,
      role: info.role,
      target: {
        type: 'add-dashboard-user',
        details: {
          campusId: info.campusId,
        },
      },
      isProduction: Config.ENV === 'prod',
    }

    const { data } = (await funcSendInvite(payload)) as { data: any }

    return data as InviteDashboardResp
  } catch (error) {
    return { success: false, message: 'groups.failed-to-invite-to-dashboard' }
  }
}
