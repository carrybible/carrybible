import ProgressBar from '@components/ProgressBar'
import { Footnote, H2, Text } from '@components/Typography'
import { Campaign } from '@dts/campaign'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React, { FC, useCallback, useMemo } from 'react'
import { Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { useSelector } from 'react-redux'
import { getRealGivingStatus, roundNumber } from '../../../../shared/Utils'

type Props = {
  campaign: Campaign
}

const GivingItem: FC<Props> = ({ campaign }) => {
  const dim = useWindowDimensions()
  const { color } = useTheme()
  const { currencies } = useSelector<RootState, RootState['settings']>(state => state.settings)
  const currencySymbol = currencies[campaign.currency || '']?.symbol || '$'
  const status = useMemo(() => {
    return {
      label: getRealGivingStatus(campaign) === 'active' ? I18n.t('text.Active') : I18n.t('text.Ended'),
      backgroundColor: campaign.status === 'active' ? color.accent : color.black,
    }
  }, [campaign, color.accent, color.black])

  const onPressViewCampaign = useCallback(() => {
    NavigationRoot.navigate(Constants.SCENES.GROUP.GIVING_PREVIEW, { campaign })
  }, [campaign])

  return (
    <TouchableOpacity
      style={[{ backgroundColor: color.background }, styles.container, color.id === 'light' ? Styles.shadow2 : styles.darkThemeShadow]}
      onPress={onPressViewCampaign}>
      <Image resizeMode="stretch" style={[styles.image, { width: dim.width - 64 }]} source={{ uri: campaign.image }} />
      <View style={styles.content}>
        <View style={[styles.statusContainer, { backgroundColor: status.backgroundColor }]}>
          <Footnote color="white">{status.label}</Footnote>
        </View>
        <H2 style={styles.text}>{campaign.name}</H2>

        <ProgressBar
          style={styles.bar}
          width={'100%'}
          value={(campaign.totalFunds / campaign.goalAmount) * 100}
          color={color.accent}
          shining
        />
        <Text style={styles.goalText}>
          <Text bold>{`${currencySymbol}${roundNumber(campaign.totalFunds)} `}</Text>
          {I18n.t('text.of goal', {
            goalVal: `${currencySymbol}${campaign.goalAmount}`,
          })}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  image: { height: 210, marginLeft: 16, borderRadius: 10, marginTop: 16 },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  content: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  text: {
    alignSelf: 'center',
    marginTop: 16,
    textAlign: 'center',
  },
  bar: { height: 16, marginTop: 16 },
  goalText: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 16,
  },
})
export default GivingItem
