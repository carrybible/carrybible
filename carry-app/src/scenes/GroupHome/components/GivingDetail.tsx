import BottomButton from '@components/BottomButton'
import MemberInGroupAvatar from '@components/MemberInGroupAvatar'
import ProgressBar from '@components/ProgressBar'
import { H2, H3, Text } from '@components/Typography'
import WebVideo from '@components/WebVideo'
import YoutubeVideo from '@components/YoutubeVideo'
import { Campaign } from '@dts/campaign'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import { getRealGivingStatus, roundNumber } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { FC, useMemo, useState } from 'react'
import { Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

const GivingDetail: FC<{ campaign: Campaign; isStudyFlow: boolean; onPressNext?: () => void }> = ({
  campaign,
  isStudyFlow,
  onPressNext,
}) => {
  const [forceReloadCount, setForceReload] = useState(1)
  const { color } = useTheme()
  const dispatch = useDispatch()
  const dim = useWindowDimensions()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { currencies } = useSelector<RootState, RootState['settings']>(state => state.settings)
  const currencySymbol = currencies[campaign?.currency || '']?.symbol || '$'
  const reloadData = () =>
    dispatch({ type: TYPES.ORGANISATION.GET_CAMPAIGNS, payload: { organisation: group.organisation, groupId: group.id } })
  const renderPreview = useMemo(() => {
    if (!campaign) return null
    return (
      <>
        <H2 style={[styles.text, styles.textAlignLeft]}>{campaign.name}</H2>
        <ProgressBar
          disableAnimation
          style={styles.bar}
          width={'100%'}
          value={((campaign.totalFunds || 0) / (campaign.goalAmount || 1)) * 100}
          color={color.accent}
          shining
        />

        <Text style={styles.goalText}>
          <Text bold>{`${currencySymbol}${roundNumber(campaign.totalFunds)} `}</Text>
          {I18n.t('text.of goal', {
            goalVal: `${currencySymbol}${campaign.goalAmount}`,
          })}
        </Text>
        <Text style={[styles.text, styles.textAlignLeft]}>{campaign.description}</Text>
        {campaign.totalDonation ? (
          <View style={[styles.giversContainer, styles.totalDonationContainer, { backgroundColor: color.gray7 }]}>
            <H3 style={styles.giversText}>{I18n.t('text.Your gift amount')}</H3>
            <H3 bold={false}>{`${currencySymbol}${roundNumber(campaign.totalDonation)}`}</H3>
          </View>
        ) : null}
        {campaign.donorIds?.length ? (
          <View style={[styles.giversContainer, { backgroundColor: color.gray7 }]}>
            <H3 style={styles.giversText}>{I18n.t('text.Givers')}</H3>
            <MemberInGroupAvatar disabled members={campaign.donorIds} style={styles.listAvatar} avatarSize={69} full />
          </View>
        ) : null}
      </>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, color.accent, color.gray7, currencySymbol, forceReloadCount])

  const realStatus = useMemo(() => {
    return getRealGivingStatus(campaign)
  }, [campaign])

  const renderStudy = useMemo(() => {
    return (
      <>
        <Text style={styles.icon}>🤝</Text>
        <H2 style={styles.text}>{campaign?.name}</H2>

        <Text style={styles.text}>{campaign?.description}</Text>
        <View style={styles.goalContainer}>
          <Text style={styles.goalText} bold>
            {I18n.t('text.Funds raised')}
          </Text>
          <Text style={styles.goalText}>
            <Text bold style={styles.totalFundText}>
              {`${currencySymbol}${campaign?.totalFunds} `}
            </Text>
            {I18n.t('text.of goal', {
              goalVal: `${currencySymbol}${campaign?.goalAmount}`,
            })}
          </Text>
        </View>

        <ProgressBar
          disableAnimation
          style={styles.bar}
          width={'100%'}
          value={((campaign?.totalFunds || 0) / (campaign?.goalAmount || 1)) * 100}
          color={color.accent}
          shining
        />
      </>
    )
  }, [campaign?.description, campaign?.goalAmount, campaign?.name, campaign?.totalFunds, color.accent, currencySymbol])

  return (
    <>
      <ScrollView key={forceReloadCount} contentContainerStyle={styles.content}>
        {campaign?.video ? (
          <>
            <WebVideo
              video={{ ...campaign?.video, service: campaign?.video?.type || campaign?.video?.videoOption || 'web', vertical: false }}
              shouldHideVideo={false}
              controlStyle={isStudyFlow && styles.videoControl}
            />
            <YoutubeVideo
              video={{ ...campaign?.video, service: campaign?.video?.type || campaign?.video?.videoOption || 'web', vertical: false }}
            />
          </>
        ) : (
          <Image resizeMode="stretch" style={[styles.image, { width: dim.width - 32 }]} source={{ uri: campaign?.image }} />
        )}
        {!isStudyFlow && renderPreview}
        {isStudyFlow && renderStudy}
      </ScrollView>
      {realStatus === 'active' && (
        <View style={styles.buttonContainer}>
          <BottomButton
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.MODAL.DONATE, {
                onClose: isSuccess => {
                  if (isSuccess !== undefined) {
                    setForceReload(count => count + 1)
                    if (isSuccess) {
                      reloadData() // Reload data for the list outside
                      onPressNext?.() // Reload data for current Campaign or go to next page
                    }
                  }
                },
                campaign,
              })
            }}
            rounded
            style={styles.button}
            title={campaign?.donorIds.includes(me.uid) ? I18n.t('text.Give again') : I18n.t('text.Give now')}
          />
          {isStudyFlow ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={onPressNext}>
              <Text style={styles.maybeLaterText} color="gray2">
                {I18n.t('text.Maybe later')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
    fontSize: 37,
  },
  textAlignLeft: {
    textAlign: 'left',
    alignSelf: 'flex-start',
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
  },
  buttonContainer: {
    marginBottom: 16,
  },
  videoControl: { left: -16 },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  maybeLaterText: { fontSize: 17 },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFundText: {
    fontSize: 20,
  },
  button: {
    marginBottom: 16,
  },
  giversContainer: {
    marginTop: 35,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
  },
  giversText: {
    marginHorizontal: 17,
  },
  listAvatar: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  totalDonationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 17,
    marginBottom: 0,
  },
  image: { height: 210, borderRadius: 10, marginTop: 16 },
})

export default GivingDetail
