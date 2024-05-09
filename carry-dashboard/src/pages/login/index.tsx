import AppLogo from '@components/Pages/Login/AppLogo'
import ConfirmEmail from '@components/Pages/Login/ConfirmEmail'
import LoginForm from '@components/Pages/Login/LoginForm'
import LoginLoading from '@components/Pages/Login/LoginLoading'
import ResendLoginLink from '@components/Pages/Login/ResendLoginLink'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { changeLoginStage } from '@redux/slices/login'
import { withTrans } from '@shared/I18n'
import { Layout } from 'antd'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const LoginPage: NextPageWithLayout = () => {
  const dispatch = useAppDispatch()
  const stage = useAppSelector((state) => state.login.stage)
  const router = useRouter()

  useEffect(() => {
    const { stage, ...rest } = router.query
    if (typeof stage === 'string' && stage === 'opening-dashboard') {
      dispatch(changeLoginStage('opening-dashboard'))
      router.replace({
        query: rest,
      })
    }
  }, [dispatch, router.query.stage])

  if (stage === 'opening-dashboard' || stage === 'logging-out') {
    return <LoginLoading stage={stage} />
  }

  return (
    <section className="flex flex-col items-center">
      <AppLogo />
      <div
        className={classNames(
          'flex flex-col rounded-2xl border-2 border-solid border-neutral-50 bg-neutral-10',
          'min-w-[40vw] py-8 px-8 sm:py-20 sm:px-16'
        )}
      >
        {stage === 'login' && <LoginForm />}
        {stage === 'sending-link' && <ConfirmEmail />}
        {stage === 'resend-link' && <ResendLoginLink />}
      </div>
    </section>
  )
}

LoginPage.getLayout = (page) => {
  return (
    <Layout>
      <Layout.Content className="flex h-screen w-screen items-center justify-center bg-primary">
        {page}
      </Layout.Content>
    </Layout>
  )
}

export const getStaticProps = withTrans()
export default LoginPage
