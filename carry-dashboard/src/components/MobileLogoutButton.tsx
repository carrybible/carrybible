import { useAppDispatch } from '@redux/hooks'
import { resetReducer } from '@redux/slices'
import { changeLoginStage } from '@redux/slices/login'
import { sendLoggedOutMessage } from '@shared/AuthBroadcastChannel'
import Firebase from '@shared/Firebase'
import classNames from 'classnames'
import { signOut } from 'firebase/auth'
import React from 'react'
import { H5 } from './Typography'
import { MdLogout } from 'react-icons/md'

export const MobileLogoutButton = () => {
  const dispatch = useAppDispatch()

  const handleLogout = async () => {
    dispatch(resetReducer())
    dispatch(changeLoginStage('logging-out'))
    await signOut(Firebase.auth)
    sendLoggedOutMessage()
  }
  return (
    <div
      className={classNames(
        'flex flex-row items-center gap-4',
        'mb-4 py-5 px-[10px]',
        'rounded-lg hover:cursor-pointer hover:bg-neutral-50/25'
      )}
      onClick={handleLogout}
    >
      <MdLogout className="h-[18px] w-[18px] text-danger sm:h-8 sm:w-8" />
      <H5 className="!mb-0 text-danger" strong={false}>
        Logout
      </H5>
    </div>
  )
}
