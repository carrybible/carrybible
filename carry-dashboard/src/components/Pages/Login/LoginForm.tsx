import Button from '@components/Button'
import Input from '@components/Input'
import { H4, Text } from '@components/Typography'
import { useAppDispatch } from '@redux/hooks'
import { changeLoginStage, updateLoginEmail } from '@redux/slices/login'
import { IS_LOCAL_DEV } from '@shared/Config'
import { sendEmailLoginLink, unlinkAccount } from '@shared/Firebase/auth'
import { validateEmail } from '@shared/Utils'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'

const LoginForm: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  useEffect(() => {
    const { email, ...rest } = router.query
    if (typeof email === 'string' && email) {
      setEmail(email)
      router.replace({
        query: rest,
      })
    }
    // Ignore router changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, router.query.email])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(updateLoginEmail(email))
    }, 100)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [dispatch, email])

  const handleChangeEmail = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (error) {
        setError('')
      }
      setEmail(e.target.value)
    },
    [error]
  )

  const handleLogin = async () => {
    try {
      if (!validateEmail(email)) {
        throw t('login.email-not-valid')
      }

      setLoading(true)
      const { success, message } = await sendEmailLoginLink(email)
      if (!success) {
        throw message ? t(message) : t('login.login-email-no-permission')
      }
      dispatch(changeLoginStage('sending-link'))
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <H4 className="!mb-10" align="center">
        {t('login.dashboard-login')}
      </H4>
      <Text strong className="pl-1">
        {t('login.login-title')}
      </Text>
      <div className="mb-7 flex flex-col">
        <Input
          placeholder={t('login.login-email-placeholder')}
          className="mb-3 mt-3"
          value={email}
          onChange={handleChangeEmail}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin()
            }
          }}
        />
        <Text
          className={classNames('max-w-[75vw] pl-1 text-danger', {
            invisible: !error,
          })}
        >
          {error}
        </Text>
      </div>
      <div className="flex justify-center">
        <Button
          onClick={handleLogin}
          className="px-12"
          disabled={!!error}
          loading={loading}
        >
          {t('login.login')}
        </Button>
      </div>
      {/*Just a dev tool to unlink account easily*/}
      {IS_LOCAL_DEV && (
        <div onClick={unlinkAccount} className="text-center opacity-50">
          Unlink account
        </div>
      )}
    </>
  )
}
export default LoginForm
