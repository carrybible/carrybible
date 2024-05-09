import { Campaign } from '@dts/campaign'
import GivingDetail from '@scenes/GroupHome/components/GivingDetail'
import React, { FC, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

const ActivityGivingCampaign: FC<{ campaign: Campaign; onShowCampaign?: () => void; onPressNext?: () => void }> = props => {
  useEffect(() => {
    props.onShowCampaign?.()
  }, [props])
  return (
    <View style={styles.container}>
      <GivingDetail campaign={props.campaign} isStudyFlow={true} onPressNext={props.onPressNext} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default ActivityGivingCampaign
