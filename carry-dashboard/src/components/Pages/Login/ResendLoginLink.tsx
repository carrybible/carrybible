import retryAnimation from '@assets/animations/retry.json'
import Button from '@components/Button'
import { H4, Text } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { changeLoginStage } from '@redux/slices/login'
import { sendEmailLoginLink } from '@shared/Firebase/auth'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import Lottie from 'react-lottie'

const ResendLoginLink: React.FC = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const email = useAppSelector((state) => state.login.email)
  const [loading, setLoading] = useState(false)

  const handleResendLink = async () => {
    setLoading(true)
    const { success, message } = await sendEmailLoginLink(email)
    if (!success) {
      throw message ? t(message) : t('login.login-email-no-permission')
    }
    dispatch(changeLoginStage('sending-link'))
  }

  return (
    <>
      <H4 className="!mb-10" align="center">
        {t('login.login-link-expired')}
      </H4>
      <div onClick={handleResendLink}>
        <Lottie
          options={{
            autoplay: false,
            animationData: retryAnimation,
          }}
          isStopped={!loading}
          width={74}
          height={74}
        />
      </div>

      <Text align="center" className={'mt-3 !mb-0'}>
        {t('login.sending-new-link')}
        <Text className="text-primary">{email}</Text>
      </Text>
      <div className="mt-3 flex justify-center">
        <Button onClick={handleResendLink} className="px-12">
          {t('login.resend-link')}
        </Button>
      </div>
    </>
  )
}
export default ResendLoginLink
