import sendingAnimation from '@assets/animations/sending.json'
import { H4, Text } from '@components/Typography'
import { useAppSelector } from '@redux/hooks'
import { useTranslation } from 'next-i18next'
import React from 'react'
import Lottie from 'react-lottie'

const ConfirmEmail: React.FC = () => {
  const { t } = useTranslation()
  const email = useAppSelector((state) => state.login.email)
  return (
    <>
      <H4 className="!mb-10" align="center">
        {t('login.login-almost-there')}
      </H4>
      <Lottie
        options={{
          autoplay: true,
          animationData: sendingAnimation,
          loop: false,
        }}
        width={100}
        height={100}
      />
      <Text align="center" className={'mt-3 !mb-0'}>
        {t('login.sending-login-link')}
        <Text className="text-primary">{email}</Text>
      </Text>
    </>
  )
}
export default ConfirmEmail
