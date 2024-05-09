import Button from '@components/Button'
import Input from '@components/Input'
import CircleLoading from '@components/Loading/CircleLoading'
import { H5 } from '@components/Typography'
import { User } from '@dts/User'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { changeLoginStage, updateLoginEmail } from '@redux/slices/login'
import { updateMe } from '@redux/slices/me'
import Firebase from '@shared/Firebase'
import { sendLoggedInMessage } from '@shared/AuthBroadcastChannel'
import { fetchDashboardAccount } from '@shared/Firebase/account'
import { linkExistedAccount, verifyLoginLink } from '@shared/Firebase/auth'
import { wait } from '@shared/Utils'
import { message, Modal } from 'antd'
import { User as FirebaseUser } from 'firebase/auth'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, {
  ForwardRefRenderFunction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type ConfirmLoginEmailModalRef = { confirmEmail: () => Promise<string | null> }
const ConfirmLoginEmailModalInternal: ForwardRefRenderFunction<
  ConfirmLoginEmailModalRef,
  {}
> = (props, ref) => {
  const { t } = useTranslation()
  const [resolveFunc, setResolveFunc] = useState<
    ((email: string) => void) | null
  >(null)
  const [email, setEmail] = useState('')

  useImperativeHandle(ref, () => ({
    confirmEmail: async (): Promise<string | null> => {
      return new Promise<string | null>((resolve) => {
        setResolveFunc(() => resolve)
      })
    },
  }))

  const handleConfirm = () => {
    resolveFunc?.(email)
    setResolveFunc(null)
  }

  return (
    <Modal
      centered
      visible={!!resolveFunc}
      footer={null}
      closable={false}
      className="!w-auto"
    >
      <H5 align="center" className="w-full break-normal">
        {t('login.please-provide-email-for-confirmation')}
      </H5>
      <Input
        placeholder={t('login.login-email-placeholder')}
        className="mb-3 mt-3"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleConfirm()
          }
        }}
      />
      <div className="flex justify-center">
        <Button onClick={handleConfirm} className="px-12">
          {t('login.confirm-email')}
        </Button>
      </div>
    </Modal>
  )
}
const ConfirmLoginEmailModal = React.forwardRef(ConfirmLoginEmailModalInternal)

type ConfirmLinkAccountModalRef = {
  confirmLinkAccount: (data: {
    email: string
    methods: string[]
  }) => Promise<FirebaseUser | undefined>
}
const ConfirmLinkAccountModalInternal: ForwardRefRenderFunction<
  ConfirmLinkAccountModalRef,
  {}
> = (props, ref) => {
  const { t } = useTranslation()
  const [data, setData] = useState<{
    resolve: (user: FirebaseUser | undefined) => void
    email: string
    methods: string[]
  } | null>(null)

  useImperativeHandle(ref, () => ({
    confirmLinkAccount: async ({
      email,
      methods,
    }: {
      email: string
      methods: string[]
    }): Promise<FirebaseUser | undefined> => {
      return new Promise<FirebaseUser | undefined>((resolve) => {
        setData({
          resolve,
          methods,
          email,
        })
      })
    },
  }))

  const handleConfirm = async () => {
    data?.resolve(
      await linkExistedAccount({ email: data.email, methods: data.methods })
    )
    setData(null)
  }

  return (
    <Modal visible={!!data} footer={null} closable={false}>
      <H5 align="center">{t('login.link-existed-account')}</H5>
      <div className="mt-5 flex justify-center">
        <Button onClick={handleConfirm} className="px-12">
          {t('login.confirm-link-account')}
        </Button>
      </div>
    </Modal>
  )
}
const ConfirmLinkAccountModal = React.forwardRef(
  ConfirmLinkAccountModalInternal
)

const LoginLoading = ({
  stage,
}: {
  stage: 'opening-dashboard' | 'logging-out'
}) => {
  const dispatch = useAppDispatch()
  const route = useRouter()
  const { t } = useTranslation()
  const ref = useRef<ConfirmLoginEmailModalRef>(null)
  const confirmRef = useRef<ConfirmLinkAccountModalRef>(null)
  const [statusMessage, setStatusMessage] = useState(() =>
    stage === 'opening-dashboard'
      ? 'login.opening-dashboard'
      : 'login.logging-out-dashboard'
  )

  const me = useAppSelector((state) => state.me)
  const isLogin = !!me.uid && !!me.permission

  useEffect(() => {
    const run = async () => {
      if (stage === 'opening-dashboard') {
        if (isLogin) {
          return
        }
        if (!ref.current || !confirmRef.current) {
          // Wait a little here to ensure that all refs will have value
          await wait(100)
        }
        if (!ref.current || !confirmRef.current) {
          message.error(t('login.login-failed'))
          return
        }

        if (Firebase.auth.currentUser) {
          return
        }

        const {
          success,
          data,
          message: errorMessage,
        } = await verifyLoginLink({
          confirmEmail: ref.current.confirmEmail,
          confirmLinkAccount: confirmRef.current.confirmLinkAccount,
          setStatusMessage,
        })

        if (!success || !data) {
          if (data?.email) {
            dispatch(updateLoginEmail(data?.email))
            dispatch(changeLoginStage('resend-link'))
            return
          }
          message.error(
            errorMessage ? t(errorMessage) : t('login.login-failed')
          )
          dispatch(changeLoginStage('login'))
          return
        }
        try {
          const userInfo = await fetchDashboardAccount()
          dispatch(
            updateMe({
              uid: data.uid,
              email: userInfo?.email,
              image: userInfo?.image,
              name: userInfo?.name,
              campusAccess: userInfo?.campusAccess,
              permission: userInfo?.permissions,
              organisation: userInfo?.organisation,
            } as User)
          )
          sendLoggedInMessage()
          route.push('/')
        } catch (error) {
          //Missing authen or session timeout
          sessionStorage.clear()
          localStorage.clear()
          dispatch(changeLoginStage('login'))
        }
      } else if (stage === 'logging-out') {
        await wait(2000)
        dispatch(changeLoginStage('login'))
      }
    }
    run()
  }, [])

  return (
    <>
      <section className="flex flex-col items-center">
        <CircleLoading />
        <H5 className="text-neutral-10">{t(statusMessage)}</H5>
      </section>
      <ConfirmLoginEmailModal ref={ref} />
      <ConfirmLinkAccountModal ref={confirmRef} />
    </>
  )
}
export default React.memo(LoginLoading)
