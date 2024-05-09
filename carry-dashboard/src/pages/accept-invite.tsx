import CircleLoading from '@components/Loading/CircleLoading'
import { LargerText } from '@components/Typography'
import { NextPageWithLayout } from '@pages/_app'
import { verifyInviteToken } from '@shared/Firebase/invite'
import { withTrans } from '@shared/I18n'
import { wait } from '@shared/Utils'
import { Layout } from 'antd'
import { useTranslation } from 'next-i18next'
import { StringParam, useQueryParam, withDefault } from 'next-query-params'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const AcceptInvitePage: NextPageWithLayout = () => {
  const [accessToken] = useQueryParam(
    'accessToken',
    withDefault(StringParam, '')
  )
  const router = useRouter()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const run = async () => {
      if (accessToken) {
        setMessage(t('invite.processing-your-invite'))
        const { success, message: serverMessage } = await verifyInviteToken({
          accessToken,
        })
        setLoading(false)
        if (success) {
          setMessage(
            serverMessage ??
              t('invite.verify-successfully-redirect-back-to-login')
          )
          await wait(3000)
          await router.replace('/')
        } else {
          setMessage(serverMessage ?? t('invite.verify-failed-or-link-expired'))
        }
      } else {
        await router.replace('/')
      }
    }

    run()
  }, [accessToken, router, t])

  return (
    <div className="flex flex-col items-center">
      {loading && <CircleLoading />}
      <LargerText className="text-neutral-10" align="center">
        {message}
      </LargerText>
    </div>
  )
}

AcceptInvitePage.getLayout = (page) => {
  return (
    <Layout>
      <Layout.Content className="flex h-screen w-screen items-center justify-center bg-primary">
        {page}
      </Layout.Content>
    </Layout>
  )
}

AcceptInvitePage.getContainer = (page) => {
  return <>{page}</>
}

export const getServerSideProps = withTrans()
export default AcceptInvitePage
