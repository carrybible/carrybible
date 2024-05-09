import React from 'react'

import { WeeklyReviewType } from '@scenes/GroupActions/WeeklyReviewScreen/type'
import { WeeklyReview } from '@dts/weeklyReview'

export const useWeeklyReviewTabView = ({ weeklyReviewData, isOwner }: { weeklyReviewData: WeeklyReview; isOwner: boolean }) => {
  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: WeeklyReviewType }[] = []
    const { groupStats, userStats } = weeklyReviewData
    if (isOwner && groupStats) {
      routes.push({
        key: WeeklyReviewType.GROUP_REVIEW_STATS,
      })
      if ((groupStats.keyContributor?.length ?? 0) > 1) {
        routes.push({
          key: WeeklyReviewType.GROUP_REVIEW_KEY_MEMBER,
        })
      }
    }
    if (userStats) {
      routes.push({
        key: WeeklyReviewType.MEMBER_REVIEW_STATS,
      })
      if (userStats.mostReactedGratitude) {
        routes.push({
          key: WeeklyReviewType.MEMBER_REVIEW_GRATITUDE_ENTRY,
        })
      }
    }
    return {
      index: 0,
      routes: routes,
    }
  })

  const handleIndexChange = React.useCallback(
    (index: number) => {
      setNavigationState({ ...navigationState, index })
    },
    [navigationState],
  )

  return {
    navigationState,
    handleIndexChange,
  }
}
