import { User } from '@dts/User'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { resetLogin } from '@redux/slices/login'
import { updateMe } from '@redux/slices/me'
import { updateAccountPermissions } from '@redux/thunks/me'
import { setupAuthBroadcastChannel } from '@shared/AuthBroadcastChannel'
import Config from '@shared/Config'
import Firebase from '@shared/Firebase'
import CryptoJS from 'crypto-js'
import { onAuthStateChanged } from 'firebase/auth'
import { DocumentReference, doc } from 'firebase/firestore'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import { IntercomProvider, useIntercom } from 'react-use-intercom'

const Authentication: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const me = useAppSelector((state) => state.me)

  const isLogin = !!me.uid && !!me.permission
  const isAtLoginPage = router.pathname.includes('/login')

  useEffect(() => {
    setupAuthBroadcastChannel()
  }, [])

  useEffect(() => {
    if (!isLogin && !isAtLoginPage) {
      const { email } = router.query
      if (email) {
        const params = new URLSearchParams({ email: email as string })
        router.replace(`/login?${params.toString()}`)
      } else {
        router.replace('/login')
      }
    } else if (isLogin && isAtLoginPage) {
      router.replace('/').then(() => {
        dispatch(resetLogin())
      })
    }
  }, [dispatch, isAtLoginPage, isLogin, router])

  if (!isLogin) {
    return <>{!isAtLoginPage ? null : children}</>
  }

  return isAtLoginPage ? (
    <>{children}</>
  ) : (
    <AuthSync userId={me.uid}>{children}</AuthSync>
  )
}

const AuthSync: React.FC<{ children: React.ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const dispatch = useAppDispatch()
  const [isWaitingForFirebaseUser, setIsWaitingForFirebaseUser] = useState(true)
  const globalMe = useAppSelector((state) => state.me)
  const [me] = useDocumentData(
    doc(
      Firebase.firestore,
      Firebase.collections.USERS,
      userId
    ) as DocumentReference<User>
  )
  useEffect(() => {
    const run = async () => {
      if (me) {
        // me.permission = [] // Remove permission in user data
        dispatch(updateMe(me))
        dispatch(updateAccountPermissions())
      }
    }
    run()
  }, [dispatch, me])

  useEffect(() => {
    onAuthStateChanged(Firebase.auth, (user) => {
      if (user) {
        setIsWaitingForFirebaseUser(false)
      }
    })
  }, [])

  const userHash = useMemo(() => {
    if (!globalMe.uid) {
      return ''
    }
    const hash = CryptoJS.HmacSHA256(
      globalMe.uid,
      '1e0uTw54yTvyWq4OVhzmwESJyu4u5WWaHBgDsO2d'
    )
    return CryptoJS.enc.Hex.stringify(hash)
  }, [globalMe.uid])

  return !isWaitingForFirebaseUser && globalMe.organisation ? (
    <IntercomProvider
      appId={Config.INTERCOM}
      autoBootProps={{
        userHash: userHash,
        name: globalMe.name,
        email: globalMe.email,
        userId: globalMe.uid,
        avatar: globalMe.image
          ? {
              type: 'avatar',
              imageUrl: globalMe.image,
            }
          : undefined,
        hideDefaultLauncher: true,
        customLauncherSelector: '#carry-feedback',
      }}
    >
      <IntercomContainer>{children}</IntercomContainer>
    </IntercomProvider>
  ) : null
}

const IntercomContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { boot } = useIntercom()

  useEffect(() => {
    boot?.()
  }, [boot])

  return <>{children}</>
}

export default Authentication
