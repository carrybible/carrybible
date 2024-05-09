import UserInfoPopup from '@components/UserInfoPopup'
import EditUserModal, {
  EditUserModalRef,
} from '@components/Modals/EditUserModal'
import SettingOrganisationModal, {
  SettingOrganisationModalRef,
} from '@components/Modals/SettingOrganisationModal'
import { Text } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { updateMemberProfile } from '@shared/Firebase/member'
import { Tooltip } from 'antd'
import classNames from 'classnames'
import { useRef, useCallback, useEffect, useMemo } from 'react'
import MemberAvatar from '@components/MemberAvatar'
import EditOrganisationModal, {
  EditOrganisationModalRef,
} from '@components/Modals/EditOrganisationModal'

export function UserInfo() {
  const me = useAppSelector((state) => state.me)
  const editUserModalRef = useRef<EditUserModalRef>(null)
  const settingOrganisationModalRef = useRef<SettingOrganisationModalRef>(null)
  const editOrganisationModalRef = useRef<EditOrganisationModalRef>(null)

  const onUpdateUserInfo = useCallback(() => {}, [])

  const onClickEditProfile = () => editUserModalRef.current?.show()

  const changeOrganisation = () => settingOrganisationModalRef.current?.show()

  const onUpdateOrganisation = () => editOrganisationModalRef.current?.show()

  const isOwnerOrGM = useMemo(
    () => me?.organisation?.role === 'owner' || me?.isGM,
    [me]
  )

  useEffect(() => {
    if (editUserModalRef.current && !me.organisation.accessedDashboard) {
      onClickEditProfile()
      updateMemberProfile(me.uid, {
        // ...me,
        organisation: { ...me.organisation, accessedDashboard: true },
      })
    }
  }, [editUserModalRef, me])

  return (
    <div className="group flex h-14 w-full flex-row items-center gap-3">
      <div>
        <MemberAvatar
          src={me.image || ''}
          className="h-10 w-10 sm:h-[55px] sm:w-[55px]"
          alt="User avatar"
          size={50}
        />
      </div>
      <div className="flex flex-col overflow-hidden truncate">
        <Text strong>{me.displayName ?? me.name}</Text>
        <Tooltip title={me.email}>
          <Text className="text-neutral-80" ellipsis={true}>
            {me.email}
          </Text>
        </Tooltip>
      </div>

      <div
        className={classNames(
          'absolute !z-50 min-w-[200px] -translate-y-16 ',
          'duration-500',
          'right-8 mt-12 sm:right-auto sm:mt-auto',
          'invisible hover:visible group-hover:visible',
          'hover:cursor-pointer hover:opacity-80'
        )}
      >
        <div>
          <UserInfoPopup
            onClickEditProfile={onClickEditProfile}
            changeOrganisation={changeOrganisation}
            onUpdateOrganisation={onUpdateOrganisation}
            isGM={me?.isGM}
            isOrganisationOwner={isOwnerOrGM}
          />
        </div>
      </div>
      <EditUserModal
        ref={editUserModalRef}
        userInfo={me}
        onUpdateUserInfo={onUpdateUserInfo}
      />
      <SettingOrganisationModal ref={settingOrganisationModalRef} />
      <EditOrganisationModal ref={editOrganisationModalRef} />
    </div>
  )
}
