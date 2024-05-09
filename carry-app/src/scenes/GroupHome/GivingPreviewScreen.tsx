import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'

import { Campaign } from '@dts/campaign'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Firestore from '@shared/Firestore'

import React, { FC, useCallback, useEffect, useState } from 'react'

import GivingDetail from './components/GivingDetail'

type Props = {
  route: { params: { campaign: Campaign } }
}

const GivingPreviewScreen: FC<Props> = props => {
  const { color } = useTheme()
  const campaign = props.route.params.campaign
  const [campaignDetail, setCampaignDetail] = useState<Campaign>()
  const { showLoading, hideLoading } = useLoading()

  const getCampaign = useCallback(async () => {
    showLoading()
    const campaignData = await Firestore.Organisations.getCampaignDetail(campaign.organizationId || campaign.organization?.id, campaign.id)
    if (campaignData.data) setCampaignDetail(campaignData.data)
    hideLoading()
  }, [campaign.id, campaign.organization?.id, campaign.organizationId, hideLoading, showLoading])

  useEffect(() => {
    getCampaign()
  }, [getCampaign])

  return (
    <Container safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <GivingDetail campaign={campaignDetail} isStudyFlow={false} onPressNext={getCampaign} />
    </Container>
  )
}

export default GivingPreviewScreen
