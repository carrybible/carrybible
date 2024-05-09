import BottomButton from '@components/BottomButton'
import { Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useDirectMessageChannelId from '@hooks/useDirectMessageChannelId'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'

import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import { Metrics } from '@shared/index'
import StreamIO from '@shared/StreamIO'
import { checkShowedDayIntro, getDateFromFirestoreTime } from '@shared/Utils'
import { differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import React, { useCallback, useContext, useState } from 'react'
import { Animated, FlatListProps, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { StudyPreviewContext } from '../context'
import StudyPreviewItem from './StudyPreviewItem'

type Props = {
  flatListProps: {
    scrollEventThrottle: FlatListProps<any>['scrollEventThrottle']
    onScroll: FlatListProps<any>['onScroll']
    contentContainerStyle: FlatListProps<any>['contentContainerStyle']
    ListFooterComponent?: FlatListProps<any>['ListFooterComponent']
    scrollRef: React.Ref<any>
    onLayout?: FlatListProps<any>['onLayout']
    onContentSizeChange?: FlatListProps<any>['onContentSizeChange']
  }
}

const PlanTab: React.FC<Props> = props => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { plan, blockIndex, progress } = useContext(StudyPreviewContext)
  const [expandedIndex, setExpandedIndex] = useState(-1)
  const { showLoading, hideLoading } = useLoading()

  const onCollapse = useCallback(
    index => {
      if (index !== expandedIndex) {
        setExpandedIndex(index)
      } else {
        setExpandedIndex(-1)
      }
    },
    [expandedIndex],
  )

  const renderItem = useCallback(
    ({ item, index }: { item: StudyPlan.Block; index: number }) => {
      const isExpand = index === expandedIndex
      return (
        <StudyPreviewItem
          index={index}
          expanded={isExpand}
          highlighted={isExpand}
          locked={index >= blockIndex}
          block={item}
          onCollapse={onCollapse}
          progress={progress?.[index + 1]}
        />
      )
    },
    [blockIndex, plan, progress, expandedIndex, onCollapse, showLoading, hideLoading],
  )

  const keyExtractor = useCallback((item, index) => 'key' + index, [])

  return (
    <>
      <Animated.FlatList
        ref={props.flatListProps.scrollRef}
        style={s.containerItem}
        data={plan?.blocks}
        ListEmptyComponent={EmptyPlan}
        initialScrollIndex={0}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={<View style={s.footer} />}
        showsVerticalScrollIndicator={false}
        {...props.flatListProps}
        contentContainerStyle={[s.contentContainer, props.flatListProps.contentContainerStyle]}
      />
      <PlanButton
        plan={plan}
        progress={progress}
        blockIndex={expandedIndex === -1 ? blockIndex : blockIndex === 0 ? blockIndex : expandedIndex + 1}
        group={group}
      />
    </>
  )
}

const EmptyPlan = () => {
  const { landscape } = useScreenMode()
  return (
    <View style={landscape ? s.emptyLand : s.empty}>
      <Text color="gray4" style={s.emptyText}>
        {I18n.t('text.Looks like your next group study needs to be set')}
      </Text>
    </View>
  )
}

const PlanButton = ({
  plan,
  progress,
  blockIndex,
  group,
}: {
  plan?: StudyPlan.GroupPlan
  progress?: { [bIndex: string]: StudyPlan.UserProgress }
  blockIndex: number
  group: RootState['group']
}) => {
  const { color } = useTheme()
  const { showLoading, hideLoading } = useLoading()
  const Analytics = useAnalytic()

  const channelOwnerId = useDirectMessageChannelId(group.owner)
  const onPressAddPlan = () => {
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
      groupId: group.id,
    })
  }

  const remindLeaderSetGoal = () => {
    // Remind Admin to set new group Study
    StreamIO.client.channel('messaging', channelOwnerId).sendMessage({
      text: I18n.t('text.Reminder The goal is not set'),
    })
    toast.success(I18n.t('text.Remind sent'))
  }

  if (!plan || plan.status === 'ended') {
    if (group.isOwner) {
      return <BottomButton title={I18n.t('text.Set a new group study')} rounded onPress={onPressAddPlan} />
    } else {
      return <BottomButton title={I18n.t('text.Remind leader to set new study')} rounded onPress={remindLeaderSetGoal} />
    }
  }

  const currentBlockIndex = Math.abs(differenceInDays(getDateFromFirestoreTime(plan.startDate), Date.now())) + 1
  const startDailyFlow = async () => {
    !progress?.[blockIndex] && Analytics.event(Constants.EVENTS.GOAL.STARTED_DOING_A_GOAL)
    const planUpdated = await Firestore.Group.triggerCreateMessage(plan, blockIndex, showLoading, hideLoading)
    const showed = await checkShowedDayIntro(plan, blockIndex)
    if (!showed) {
      await new Promise(resolve => {
        NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.DAY_INTRO, {
          onConfirm: () => resolve(true),
          plan: planUpdated,
          blockIndex,
        })
      })
    }
    NavigationRoot[!showed ? 'replace' : 'navigate'](Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
      plan: planUpdated,
      block: planUpdated?.blocks[blockIndex - 1],
      blockIndex: blockIndex,
      progress: progress?.[blockIndex],
      isRedo: progress?.[blockIndex]?.isCompleted,
      useFadeTransition: !showed,
    })
  }

  // Not start yet
  if (blockIndex === 0) {
    return (
      <BottomButton
        title={
          currentBlockIndex > 1 ? I18n.t('text.Starting in s', { currentBlockIndex }) : I18n.t('text.Starting in', { currentBlockIndex })
        }
        rounded
        disabled
      />
    )
  }

  // Previous day selected
  if (blockIndex < currentBlockIndex) {
    return <BottomButton title={I18n.t('text.Redo day placeholder', { dayValue: blockIndex })} rounded onPress={() => startDailyFlow()} />
  }

  // Future day selected
  if (blockIndex > currentBlockIndex) {
    if (group.isOwner) {
      return (
        <BottomButton
          secondary
          style={{ backgroundColor: color.background, borderColor: `${color.accent}40` }}
          title={I18n.t('text.Edit day', { dayValue: blockIndex })}
          rounded
          onPress={() => {
            const index = blockIndex - 1
            NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_BUILDER, {
              index,
              name: plan.blocks[index].name,
              activities: plan.blocks[index].activities,
              onUpdateBlock: async (newBlock: StudyPlan.Block) => {
                const result = await Firestore.Group.updateGroupPlanBlock({
                  groupId: group.id,
                  plan,
                  newBlock,
                  blockIndex: index,
                })
                if (!result) {
                  toast.error(I18n.t('error.Unable to update'))
                } else {
                  toast.success(I18n.t('text.Successfully'))
                }
              },
              onDeleteBlock: null,
            })
          }}
        />
      )
    }
    return null
  }

  // No day selected or current day selected
  return (
    <BottomButton
      title={
        progress?.[blockIndex]
          ? progress?.[blockIndex].isCompleted
            ? I18n.t('text.View todays study')
            : I18n.t('text.Continue goal')
          : I18n.t('text.Start today study')
      }
      rounded
      onPress={() => startDailyFlow()}
    />
  )
}

const s = StyleSheet.create({
  contentContainer: {
    paddingTop: 12,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  containerItem: {
    flex: 1,
  },
  emptyLand: {
    flex: 1,
    marginTop: 20,
  },
  empty: {
    flex: 1,
    marginTop: '20%',
  },
  emptyText: {
    textAlign: 'center',
  },
  footer: {
    height: 30,
  },
})

export default PlanTab
