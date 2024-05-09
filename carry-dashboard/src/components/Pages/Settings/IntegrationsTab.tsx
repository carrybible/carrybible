import IntegrationImage from '@assets/images/IntegrationImage.png'
import Banner from '@components/Banner'
import { useTranslation } from 'next-i18next'
import { FC, useEffect, useMemo, useState } from 'react'
// import PlanningCenterLogo from '@assets/images/PlanningCenterLogo.png'
import CheckCircle from '@assets/icons/CheckCircle.svg'
import Checked from '@assets/icons/Checked.svg'
import StripeLogo from '@assets/images/StripeLogo.png'
import Button from '@components/Button'
import { H4, Text } from '@components/Typography'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { connectStripe } from '@shared/Firebase/giving'
import { message } from 'antd'
import classNames from 'classnames'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { checkConnectStripe } from '../../../shared/Firebase/giving'
import LoadingDot from '../../Loading/LoadingDot'

type IntegrationsTabProps = {}

const IntegrationsTab: FC<IntegrationsTabProps> = () => {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const [loading, setLoading] = useState(false)
  const [stripeStatus, setStripeStatus] = useState('')
  const { startLoading, stopLoading } = useGlobalLoading()

  useEffect(() => {
    const checkConnect = async () => {
      const response = await checkConnectStripe()
      if (response) {
        setStripeStatus(response.status)
      }
      setLoading(false)
    }

    setLoading(true)
    checkConnect()
  }, [])

  const getFullPath = () => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : ''

    const URL = `${origin}${asPath}`
    return URL
  }

  const handleConnectStripe = async (isExpired?: boolean) => {
    if (stripeStatus === 'pending') {
      return message.success(t('integrations.already-pending'))
    }
    if (stripeStatus === 'connected') {
      return message.success(t('integrations.already-connected'))
    }
    startLoading()
    const fullPath = getFullPath()
    const redirect = await connectStripe({
      linkExpired: isExpired || false,
      refreshUrl: `${fullPath}&stripeConnectStatus=failed`,
      returnUrl: `${fullPath}&stripeConnectStatus=done`,
    })
    stopLoading()

    if (redirect) {
      push(redirect.url)
    }
  }

  const status = useMemo(() => {
    if (stripeStatus === 'connected') return t('integrations.connected')
    if (stripeStatus === 'pending') return t('integrations.pending')
    return t('integrations.connect')
  }, [stripeStatus, t])

  const Icon = useMemo(() => {
    if (stripeStatus === 'connected')
      return <Image src={Checked} width={60} height={60} alt="CheckIcon" />
    if (stripeStatus === 'pending')
      return (
        <Image src={CheckCircle} width={30} height={30} alt="CheckCircle" />
      )
    return null
  }, [stripeStatus])

  return (
    <div>
      <Banner
        className="my-6"
        title={t('integrations.title-banner')}
        content={t('integrations.content-banner')}
        image={{
          img: IntegrationImage,
          imgAlt: 'IntegrationImage',
          width: 150,
          height: 130,
        }}
      />
      <H4>{t('integrations.integrations-title')}</H4>
      <div
        className={classNames(
          'mt-6 py-10 px-6',
          'flex flex-row',
          'rounded-2xl border-2 border-solid border-neutral-50',
          'bg-neutral-10'
        )}
      >
        <Image src={StripeLogo} width={150} height={50} alt="StripeLogo" />
        <div className="ml-6 mr-3 justify-center">
          <H4>{t('integrations.giving-stripe')}</H4>
          <Text className="text-center text-neutral-80 sm:text-start">
            {t('integrations.giving-stripe-desc')}
          </Text>
        </div>
        <div className="w-[200px] self-center">
          {loading ? (
            <LoadingDot />
          ) : (
            <Button
              icon={Icon}
              onClick={() => handleConnectStripe()}
              type={!stripeStatus ? 'primary' : 'secondary'}
              className="h-fit w-full self-center sm:w-auto"
            >
              {status}
            </Button>
          )}
        </div>
      </div>
      {/* <div
        className={classNames(
          'mt-6 py-10 px-6',
          'flex flex-row',
          'rounded-2xl border-2 border-solid border-neutral-50',
          'bg-neutral-10'
        )}
      >
        <Image
          src={PlanningCenterLogo}
          width={107}
          height={107}
          alt="PlanningCenterLogo"
        />
        <div className="ml-6 mr-3 justify-center">
          <H4>Planning Center</H4>
          <Text className="text-center text-neutral-80 sm:text-start">
            {t('integrations.planning-center-desc')}
          </Text>
        </div>
        <Button
          icon={
            connectedPlanningCenter ? (
              <Image src={Checked} width={60} height={60} alt="CheckIcon" />
            ) : undefined
          }
          type={connectedPlanningCenter ? 'secondary' : 'primary'}
          className="h-fit w-full self-center sm:w-auto"
        >
          {connectedPlanningCenter
            ? t('integrations.connected')
            : t('integrations.connect')}
        </Button>
      </div> */}
    </div>
  )
}

export default IntegrationsTab
