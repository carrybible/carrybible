import React from 'react'
import { StyleSheet, View, Text as RNText } from 'react-native'
import { useSelector } from 'react-redux'
import I18n from 'i18n-js'

import { UserStats } from '@dts/weeklyReview'
import { RootState } from '@dts/state'
import { H1, Text } from '@components/Typography'
import Avatar from '@components/Avatar'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'

import StatItem from './StatItem'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'

type Props = {
  userStats: UserStats
}

const MemberReviewStat: React.FC<Props> = ({ userStats }) => {
  const { color } = useTheme()
  const { landscape } = useScreenMode()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const hasEmptyValue =
    userStats.totalGroupActions.prayer === 0 ||
    userStats.totalMessages === 0 ||
    userStats.totalGroupActions.gratitude === 0 ||
    userStats.streakGain === 0
  return (
    <View style={styles.wrapper}>
      <ScreenView scrollable={{ right: true }}>
        <View style={landscape ? styles.flex : styles.centerItems}>
          <H1 align="center" style={styles.headerTitle}>
            {hasEmptyValue ? I18n.t('text.empty review title') : I18n.t('text.full review title')}
          </H1>
          <View style={styles.avatarWrapper}>
            <Avatar size={Metrics.screen.width * 0.3} url={me.image} touchable={false} borderWidth={5} borderColor={color.whiteSmoke} />
          </View>
        </View>
        <View style={styles.statItemWrapper}>
          <StatItem value={userStats.totalGroupActions.prayer} title={I18n.t('text.prayer share')} />
          <StatItem value={userStats.totalMessages} title={I18n.t('text.Messages sent')} />
          <StatItem value={userStats.totalGroupActions.gratitude} title={I18n.t('text.Gratitude shared')} />
          <StatItem value={userStats.streakGain} title={I18n.t('text.Streaks gained')} />
        </View>
        {hasEmptyValue ? (
          <Text align="center" style={styles.emptyMessage}>
            <RNText style={styles.boldText}>{I18n.t('text.Growth Challenge')}</RNText>
            {` ${I18n.t('text.Growth message')}`}
          </Text>
        ) : null}
      </ScreenView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  statItemWrapper: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignContent: 'center',
  },
  headerTitle: {
    marginTop: 20,
  },
  avatarWrapper: {
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boldText: {
    fontWeight: '700',
  },
  emptyMessage: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  flex: { flex: 1 },
  centerItems: { alignItems: 'center', width: Metrics.screen.width },
})

export default MemberReviewStat
