import useLoading from '@hooks/useLoading'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore } from '@shared/index'
import I18n from 'i18n-js'

const useJoinGroup = (): { handleJoinGroup: (code: string) => void } => {
  const { showLoading, hideLoading } = useLoading()
  const handleJoinGroup = async (rawCode: string) => {
    const code = rawCode.replace(/-/g, '')
    if (!code) {
      toast.error(I18n.t('text.Please input your group invite code'))
      return
    }
    showLoading()
    try {
      const data = await Firestore.Group.getInvitationByCode(code)
      if (!data || (!data.groupId && !data.organisationId)) {
        toast.error(I18n.t('text.Invite code is not valid'))
        return
      }
      const { groupId, organisationId } = data
      if (organisationId) {
        if (!data.sharedGroups || data.sharedGroups.length === 0) {
          toast.error(I18n.t('text.Invite code is not valid'))
          return
        }
        NavigationRoot.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_ORGANISATION, {
          invitation: data,
        })
        return
      }
      if (groupId) {
        NavigationRoot.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, {
          inviteCode: code,
          groupId,
        })
        return
      }
    } finally {
      hideLoading()
    }
  }

  return {
    handleJoinGroup,
  }
}

export default useJoinGroup
