import { useAppDispatch } from '@redux/hooks'
import { resetReducer } from '@redux/slices'
import { changeLoginStage } from '@redux/slices/login'
import { sendLoggedOutMessage } from '@shared/AuthBroadcastChannel'
import Firebase from '@shared/Firebase'
import classNames from 'classnames'
import { signOut } from 'firebase/auth'
import React from 'react'
import { MdLogout } from 'react-icons/md'
import { Text } from '@components/Typography'

export const LogoutButton = () => {
  const dispatch = useAppDispatch()

  const handleLogout = async () => {
    dispatch(resetReducer())
    dispatch(changeLoginStage('logging-out'))
    await signOut(Firebase.auth)
    sendLoggedOutMessage()
  }

  return (
    <div className={classNames('flex items-center')} onClick={handleLogout}>
      <MdLogout size={20} className="text-danger" />
      <Text className="ml-2 text-danger">Logout</Text>
    </div>
  )
}
