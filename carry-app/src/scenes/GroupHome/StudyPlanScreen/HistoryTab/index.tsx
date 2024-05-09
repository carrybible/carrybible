import BottomButton from '@components/BottomButton'
import EmptyData from '@components/EmptyData'
import Loading from '@components/Loading'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useFirestoreCollection from '@hooks/useFirestoreCollection'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Metrics } from '@shared/index'
import { getDateFromFirestoreTime } from '@shared/Utils'
import { compareDesc } from 'date-fns'
import add from 'date-fns/add'
import format from 'date-fns/format'
import I18n from 'i18n-js'
import React, { useEffect, useMemo, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'

import GoalItem from './GoalItem'

const HistoryTab = props => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { channel, isOwner } = group
  const user = useSelector<any, App.User>(state => state.me)
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const data = channel?.data
  const [draftPlans, setDraftPlans] = useState<StudyPlan.UserPlan[]>([])
  const Analytics = useAnalytic()

  const { data: plans, loading } = useFirestoreCollection<any>(
    {
      ref: Firestore.Study.planCollectionref(group.id),
      orderBy: 'created',
      limit: 3,
      direction: 'desc',
      isSync: true,
    },
    [data?.id],
  )
  // Sync draft plan
  useEffect(() => {
    if (!data?.id || !isOwner) return

    const ref = Firestore.Study.getUserPlanByGroupRef(user.uid, group.id)
    const unsubscribe = ref?.onSnapshot(snap => {
      if (snap) {
        const dataPlans: any = snap.docs.map(val => val.data())
        setDraftPlans(dataPlans)
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [data?.id])

  const renderItem = ({ item }) => {
    // New style

    if (item.state === 'draft') {
      return null
    }

    const plan: StudyPlan.GroupPlan = item
    const startDate = getDateFromFirestoreTime(plan.startDate)

    const endAt = add(startDate, { [`${plan.pace}s`]: plan.duration })
    const endAtTitle = add(startDate, { [`${plan.pace}s`]: plan.duration - 1 })
    const currentDay = new Date()
    const isIntime = compareDesc(startDate, currentDay) && compareDesc(currentDay, endAt)
    let status = isIntime && plan.id === group.activeGoal?.id && plan.status !== 'ended' ? 'normal' : 'ended'
    if (plan.status === 'future') {
      status = 'future'
    }

    return (
      <GoalItem
        name={plan.name}
        time={`${format(startDate, 'LLL do', { locale: global.locale })} - ${format(endAtTitle, 'LLL do', { locale: global.locale })}`}
        // @ts-ignore
        status={status}
        completed={plan.memberProgress[user.uid]?.isCompleted}
        process={plan.memberProgress[user.uid]?.percent || 0}
        onPress={() => {
          if (plan.status === 'ended') {
            Analytics.event(Constants.EVENTS.GOAL.VIEW_ENDED_GOAL)
          } else {
            Analytics.event(Constants.EVENTS.GOAL.PREVIEWED_GOAL)
          }

          navigation.navigate(Constants.SCENES.STUDY_PLAN.PREVIEW, {
            planId: plan.id,
            groupId: group.id,
            isFuturePlan: status === 'future',
          })
        }}
        startDate={startDate.getTime()}
        endDate={endAt.getTime()}
      />
    )
  }

  const getItemLayout = React.useCallback((_data, index) => ({ length: 110, offset: 110 * index, index }), [])

  const dataList = useMemo(() => {
    return [...draftPlans, ...plans]
  }, [plans, draftPlans])

  if (loading) return <Loading />

  return (
    <>
      <Animated.FlatList
        data={dataList || []}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        horizontal={false}
        keyExtractor={item => `${item.id}`}
        style={s.container}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyData text={I18n.t('empty.goal')} image={require('@assets/images/no-goals.png')} style={s.emptyData} />}
        ref={props.flatListProps.scrollRef}
        {...props.flatListProps}
        contentContainerStyle={[{ paddingTop: Metrics.insets.top }, props.flatListProps.contentContainerStyle]}
      />
      <BottomView group={group} />
    </>
  )
}

const BottomView = ({ group }) => {
  const onPressAdd = () => {
    NavigationRoot.push(Constants.SCENES.STUDY_PLAN.PICK_STUDY, { groupId: group.id, isFromGroup: true, isHaveActive: false })
  }

  if (group.isOwner) {
    return <BottomButton title={I18n.t('text.Create new study')} rounded onPress={onPressAdd} />
  }
  return null
}

const s = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  emptyData: { marginTop: '25%', marginBottom: 30 },
})

export default React.memo(HistoryTab)
