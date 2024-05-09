import { H4 } from '@components/Typography'
import { useTranslation } from 'next-i18next'

import React, { FC, useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { cacheMembersData } from '@redux/slices/members'
import InviteToDashboardModal, {
  InviteToDashboardModalRef,
} from '@components/Modals/InviteToDashboardModal'
import DashboardUsersTable from '@components/Table/DashboardUsersTable'
import DashboardRoleSelectionModal, {
  DashboardRoleSelectionModalRef,
} from '@components/Modals/DashboardRoleSelectionModal'
import AddCampusToUserModal, {
  AddCampusToUserModalRef,
} from '@components/Modals/AddCampusToUserModal'
import { changeRoleAccess, MemberDataType } from '@shared/Firebase/member'
import DeleteMemberAccessModal, {
  DeleteMemberAccessModalRef,
} from '@components/Modals/DeleteMemberAccessModal'
import { message } from 'antd'
import { User } from '@dts/User'

type UsersTabProps = {}

const UsersTab: FC<UsersTabProps> = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const me = useAppSelector((state) => state.me) as User
  const organisation = useAppSelector((state) => state.me.organisation)
  const { cacheData: initData } = useAppSelector((state) => state.members)
  const inviteToDashboardModalRef = useRef<InviteToDashboardModalRef>(null)
  const dashboardRoleSelectionModalRef =
    useRef<DashboardRoleSelectionModalRef>(null)
  const dashboardChangeRoleSelectionModalRef =
    useRef<DashboardRoleSelectionModalRef>(null)
  const addCampusToUserModalRef = useRef<AddCampusToUserModalRef>(null)
  const deleteMemberAccessModalRef = useRef<DeleteMemberAccessModalRef>(null)

  const [userSelected, setUserSelected] = useState<MemberDataType | null>(null)

  const onClickAddMember = () => inviteToDashboardModalRef.current?.show()
  const onPressRemoveAccess = useCallback((user: MemberDataType) => {
    deleteMemberAccessModalRef.current?.show({
      userId: user.uid,
      userAvatar: user.image,
      userName: user.name,
    })
  }, [])

  const handleChangeRole = async (userInfo: MemberDataType) => {
    setUserSelected(userInfo)
    dashboardChangeRoleSelectionModalRef.current?.show()
  }

  const handleChangeRoleProcess = async (role: string | undefined) => {
    if (!userSelected || !role) {
      return
    }
    const result = await changeRoleAccess(userSelected.uid, role, me)
    if (result && result.success) {
      message.success(t('members.change-role-success'))
    } else {
      message.error(t('error-server'))
    }
    setReload(true)
  }

  const [reload, setReload] = useState(false)

  return (
    <div>
      <H4 className="mt-6">{t('members.dashboard-users')}</H4>

      <div className="mt-5">
        <DashboardUsersTable
          scope="organisation"
          scopeId={organisation!.id}
          initData={initData}
          onSync={(data) => dispatch(cacheMembersData(data))}
          isSettings
          onClickAddMember={onClickAddMember}
          reload={reload}
          onPressDeleteMember={(userInfo: MemberDataType) =>
            onPressRemoveAccess(userInfo)
          }
          onChangeRole={(userInfo: MemberDataType) =>
            handleChangeRole(userInfo)
          }
          setReload={(data) => setReload(data)}
        />
      </div>

      <InviteToDashboardModal
        ref={inviteToDashboardModalRef}
        onSelectRole={dashboardRoleSelectionModalRef.current?.show!}
        onSelectCampus={addCampusToUserModalRef.current?.show!}
        reload={() => setReload(true)}
      />
      <DashboardRoleSelectionModal ref={dashboardRoleSelectionModalRef} />
      <DashboardRoleSelectionModal
        ref={dashboardChangeRoleSelectionModalRef}
        handleResult={async (role: string | undefined) =>
          await handleChangeRoleProcess(role)
        }
      />
      <DeleteMemberAccessModal
        ref={deleteMemberAccessModalRef}
        onDeleted={() => {
          setReload(true)
        }}
      />
      <AddCampusToUserModal ref={addCampusToUserModalRef} />
    </div>
  )
}

export default UsersTab
