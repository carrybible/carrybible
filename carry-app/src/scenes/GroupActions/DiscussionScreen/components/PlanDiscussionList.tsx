import EmptyData from '@components/EmptyData'
import Loading from '@components/Loading'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import ThreadGroupByPlanListItem, { ThreadGroupByPlanType } from '@scenes/GroupActions/components/ThreadGroupByPlanListItem'
import { Firestore } from '@shared/index'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

const PlanDiscussionList: React.FC = () => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const [plans, setPlans] = useState<StudyPlan.GroupPlan[] | undefined>()
  const [hasUnreadDiscussionMap, setHasUnreadDiscussionMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const plansRef = Firestore.Group.plansRef(group.id).orderBy('startDate', 'desc')
    const unsubscribe = plansRef.onSnapshot(collections => {
      const plans: StudyPlan.GroupPlan[] = []
      collections.docs.forEach(snap => {
        const plan = snap.data() as StudyPlan.GroupPlan
        if (checkPlanContainDiscussion(plan)) {
          plans.push(plan)
        }
      })
      setPlans(plans)
    })

    return () => {
      unsubscribe?.()
    }
  }, [group.id])

  useEffect(() => {
    if (!plans) {
      return
    }
    const unsubscribeFns: (() => void)[] = []
    plans.map(async plan => {
      const unsub = Firestore.Group.unreadThreadsRef(group.id, plan.id)?.onSnapshot(snap => {
        setHasUnreadDiscussionMap(prevMap => ({
          ...prevMap,
          [plan.id]: !!snap.size,
        }))
      })
      if (unsub) {
        unsubscribeFns.push(unsub)
      }
    })

    return () => {
      unsubscribeFns.forEach(fns => fns())
    }
  }, [group.id, plans])

  const data = useMemo(() => {
    if (plans?.some(plan => hasUnreadDiscussionMap[plan.id] == null)) {
      return undefined
    }

    return plans?.map(plan => ({
      plan,
      hasUnread: hasUnreadDiscussionMap[plan.id],
    }))
  }, [hasUnreadDiscussionMap, plans])

  const renderPlanItem = ({ item }) => <ThreadGroupByPlanListItem item={item} group={group} />
  const keyPlanExtractor = (item: ThreadGroupByPlanType) => `${item.plan.id.toString()}`
  const getPlanItemLayout = useCallback((_data, index) => ({ length: 124, offset: 124 * index + 15, index }), [])

  if (!data) {
    return <Loading />
  }

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      data={data}
      renderItem={renderPlanItem}
      keyExtractor={keyPlanExtractor}
      getItemLayout={getPlanItemLayout}
      ListHeaderComponent={<View style={styles.listHeader} />}
      ListEmptyComponent={
        <EmptyData
          type="textIcon"
          text={I18n.t('text.No new study discussions')}
          subText={I18n.t('text.Study discussions from the daily study will appear here')}
          image={'💬'}
          style={styles.emptyData}
          iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
        />
      }
      ListFooterComponent={<View style={styles.footer} />}
    />
  )
}

const styles = StyleSheet.create({
  listHeader: {
    height: 10,
  },
  footer: {
    height: 32,
  },
  emptyData: { marginTop: '25%' },
})

const checkPlanContainDiscussion = (plan: StudyPlan.GroupPlan) => {
  return plan.blocks.some(block => {
    return block.activities.some(act => act.type === 'question')
  })
}

export default PlanDiscussionList
