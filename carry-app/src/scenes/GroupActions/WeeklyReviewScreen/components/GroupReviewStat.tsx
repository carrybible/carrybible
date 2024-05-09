import React from 'react'
import { StyleSheet, View } from 'react-native'
import I18n from 'i18n-js'

import { GroupStats } from '@dts/weeklyReview'
import { H1, H3 } from '@components/Typography'
import GroupMemberAvatars from '@components/GroupMemberAvatars'
import { Metrics } from '@shared/index'

import StatItem from './StatItem'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'

type Props = {
  groupStats: GroupStats
}

const GroupReviewStat: React.FC<Props> = ({ groupStats }) => {
  const { landscape } = useScreenMode()
  return (
    <View style={styles.wrapper}>
      <ScreenView scrollable={{ right: true }}>
        <View style={landscape ? styles.flex : styles.centerItems}>
          <H1 align="center" style={styles.headerTitle}>
            {I18n.t('text.Check out your group s activityfrom this week')}
          </H1>
          <View style={styles.avatars}>
            <GroupMemberAvatars avatarSize={Metrics.screen.width * 0.17} avatarBorderSize={3} fontSize={28} style={styles.groupAvatars} />
          </View>
        </View>
        <View style={styles.statItemWrapper}>
          <StatItem value={groupStats.totalGroupActions.prayer} title={'🙏 Prayers'} />
          <StatItem value={groupStats.totalMessages} title={'💬 Messages'} />
          <StatItem value={groupStats.totalGroupActions.gratitude} title={'🎉 Gratitude entries'} />
          <StatItem value={groupStats.totalEngagedMembers} title={'⚡️ Engaged members'} />
        </View>

        <H3 bold={false} color={'black2'} style={styles.bottomText}>
          {I18n.t('text.Dont worry only you can see these stats')}
        </H3>
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
    flex: 2,
    flexWrap: 'wrap',
    flexDirection: 'row',
    // backgroundColor: 'red',
    alignContent: 'center',
  },
  bottomText: {
    marginBottom: 40,
    textAlign: 'center',
  },
  headerTitle: {
    marginTop: 20,
  },
  groupAvatars: {
    flex: 1,
  },
  flex: { flex: 1 },
  centerItems: { alignItems: 'center', width: Metrics.screen.width },
  avatars: { justifyContent: 'center', alignItems: 'center', height: Metrics.screen.width * 0.17, marginTop: 20 },
})

export default GroupReviewStat
