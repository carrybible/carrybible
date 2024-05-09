import ProgressBar from '@components/ProgressBar'
import { H2, Text } from '@components/Typography'
import { Campaign } from '@dts/campaign'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Config from '@shared/Config'
import Constants from '@shared/Constants'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { Image, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { useSelector } from 'react-redux'
import { GradientCover } from '../components/ConnectionView'
type Props = {
  campaign: Campaign
}

const GivingPrompt: FC<Props> = ({ campaign }) => {
  const dim = useWindowDimensions()
  const { color, typography } = useTheme()
  const [height, setHeight] = useState(10000)
  const onPressViewCampaign = useCallback(() => {
    NavigationRoot.navigate(Constants.SCENES.GROUP.GIVING_PREVIEW, { campaign })
  }, [campaign])
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { currencies } = useSelector<RootState, RootState['settings']>(state => state.settings)
  const currencySymbol = currencies[campaign.currency || '']?.symbol || '$'

  const isDonated = campaign.donorIds.includes(me.uid)

  const btnStyles = useMemo(() => {
    if (isDonated) {
      return {
        backgroundColor: color.transparent,
        borderColor: color.whiteSmoke,
      }
    } else {
      return {
        backgroundColor: Config.VARIANT === 'carry' ? color.accent : '#000',
        borderColor: Config.VARIANT === 'carry' ? color.accent : '#000',
      }
    }
  }, [color, isDonated])

  const content = useMemo(() => {
    return (
      <View
        style={[
          isDonated ? styles.donatedContainer : styles.container,
          { backgroundColor: color.background },
          isDonated ? (color.id === 'light' ? Styles.shadow3 : styles.darkThemeShadow) : {},
        ]}
        onLayout={e => setHeight(e.nativeEvent.layout.height + 6)}>
        <Image resizeMode="stretch" style={[styles.image, { width: dim.width - 69 }]} source={{ uri: campaign.image }} />
        <View style={styles.content}>
          <Text style={styles.icon}>🤝</Text>
          <H2 style={styles.text}>{campaign.name}</H2>
          <Text style={styles.text}>{campaign.description}</Text>
          <ProgressBar
            style={styles.bar}
            width={'100%'}
            value={(campaign.totalFunds / campaign.goalAmount) * 100}
            color={color.accent}
            shining
          />
          <Text style={styles.goalText}>
            <Text bold>{`${currencySymbol}${campaign.totalFunds} `}</Text>
            {I18n.t('text.of goal', {
              goalVal: `${currencySymbol}${campaign.goalAmount}`,
            })}
          </Text>
        </View>

        <TouchableOpacity style={[styles.button, btnStyles]} onPress={onPressViewCampaign}>
          <Text bold color={isDonated ? 'gray4' : 'white'} style={{ fontSize: typography.body }}>
            {isDonated ? I18n.t('text.View campaign') : I18n.t('text.Learn more')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }, [
    btnStyles,
    campaign.description,
    campaign.goalAmount,
    campaign.image,
    campaign.name,
    campaign.totalFunds,
    color.accent,
    color.background,
    color.id,
    currencySymbol,
    dim.width,
    isDonated,
    onPressViewCampaign,
    typography.body,
  ])
  if (isDonated) return content
  return (
    <GradientCover customColor={color.accent} borderRadius={12} style={[styles.gradientView, { height }]}>
      {content}
    </GradientCover>
  )
}

const styles = StyleSheet.create({
  gradientView: { marginHorizontal: 16, marginBottom: 16 },
  container: {
    borderRadius: 10,
    margin: 3,
  },
  image: { height: 210, marginLeft: 16, borderRadius: 10, marginTop: 16 },
  donatedContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    alignSelf: 'center',
    fontSize: 37,
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
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 3,
    paddingVertical: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
})
export default GivingPrompt
