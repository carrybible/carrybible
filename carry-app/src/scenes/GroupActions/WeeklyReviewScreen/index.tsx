import React from 'react'
import { StyleSheet, View } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSelector } from 'react-redux'
import { TabView } from 'react-native-tab-view'
import I18n from 'i18n-js'

import { RootState } from '@dts/state'
import { WeeklyReview } from '@dts/weeklyReview'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import BottomButton from '@components/BottomButton'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { Metrics } from '@shared/index'

import { useWeeklyReviewTabView } from './hook'
import { WeeklyReviewType } from './type'
import GroupReviewStat from './components/GroupReviewStat'
import GroupReviewKeyMember from './components/GroupReviewKeyMember'
import MemberReviewStat from '@scenes/GroupActions/WeeklyReviewScreen/components/MemberReviewStat'
import MemberReviewGratitude from '@scenes/GroupActions/WeeklyReviewScreen/components/MemberReviewGratitude'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

type ParamProps = {
  weeklyReviewData: WeeklyReview
}

type Props = StackScreenProps<{ WeeklyReviewScreen: ParamProps }, 'WeeklyReviewScreen'>

const WeeklyReviewScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { weeklyReviewData } = props.route.params
  const { groupStats, userStats } = weeklyReviewData
  const { navigationState, handleIndexChange } = useWeeklyReviewTabView({ weeklyReviewData, isOwner: group.isOwner })
  const renderScene = React.useCallback(
    ({ route }) => {
      switch (route.key) {
        case WeeklyReviewType.GROUP_REVIEW_STATS: {
          if (!groupStats) {
            return null
          }
          return <GroupReviewStat groupStats={groupStats} />
        }
        case WeeklyReviewType.GROUP_REVIEW_KEY_MEMBER: {
          if (!groupStats?.keyContributor) {
            return null
          }
          return <GroupReviewKeyMember keyMemberIds={groupStats.keyContributor.map(({ uid }) => uid)} />
        }
        case WeeklyReviewType.MEMBER_REVIEW_STATS: {
          if (!userStats) {
            return null
          }
          return <MemberReviewStat userStats={userStats} />
        }
        case WeeklyReviewType.MEMBER_REVIEW_GRATITUDE_ENTRY: {
          if (!userStats?.mostReactedGratitude) {
            return null
          }
          return <MemberReviewGratitude groupAction={userStats.mostReactedGratitude} />
        }
        default:
          return null
      }
    },
    [groupStats, userStats],
  )

  const handleContinuePress = React.useCallback(() => {
    if (navigationState.index === navigationState.routes.length - 1) {
      NavigationRoot.pop()
      return
    }
    handleIndexChange(navigationState.index + 1)
  }, [handleIndexChange, navigationState])

  return (
    <Container safe>
      <HeaderBar onPressRight={() => NavigationRoot.pop()} iconRight="x" colorRight={color.text} />
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={navigationState}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={handleIndexChange}
          initialLayout={INITIAL_LAYOUT}
        />
      </View>
      <BottomButton title={I18n.t('text.Continue')} rounded={true} onPress={handleContinuePress} />
    </Container>
  )
}

const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
  },
})

export default WeeklyReviewScreen
