import Avatar from '@components/Avatar'
import Container from '@components/Container'
import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'
import Loading from '@components/Loading'
import { H1 } from '@components/Typography'
import { App } from '@dts/app'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { StackScreenProps } from '@react-navigation/stack'
import ThreadListItem, { ThreadItem } from '@scenes/GroupActions/components/ThreadListItem'
import { NavigationRoot } from '@scenes/root'
import { Firestore } from '@shared/index'
import I18n from 'i18n-js'
import React, { FC, useEffect, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

type ParamProps = { plan: StudyPlan.GroupPlan; initThreads?: App.Thread[] }

type Props = StackScreenProps<{ PlanDiscussionScreen: ParamProps }, 'PlanDiscussionScreen'>

const PlanDiscussionScreen: FC<Props> = ({ route }) => {
  const { color } = useTheme()
  const { plan, initThreads } = route.params

  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [threads, setThreads] = useState<ThreadItem[]>(
    () =>
      initThreads?.map(thread => ({
        ...thread,
        plan,
      })) ?? [],
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let unsubscribe
    const run = async () => {
      if (!initThreads?.length) {
        setLoading(true)
      }

      const threadsRef = Firestore.Group.threadRef(group.id) as FirebaseFirestoreTypes.CollectionReference
      unsubscribe = threadsRef
        .where('planID', '==', plan.id)
        .orderBy('startDate', 'asc')
        .limit(100)
        .onSnapshot(snap => {
          setLoading(false)
          if (!snap) {
            return
          }
          setThreads(
            snap.docs.map(data => {
              const thread = data.data() as App.Thread
              return {
                ...thread,
                plan,
              }
            }),
          )
        })
    }

    run()

    return () => {
      unsubscribe?.()
    }
  }, [group.id, initThreads?.length, plan])

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <View style={[styles.planInfoWrapper, { borderColor: color.gray4 }]}>
        <Avatar url={plan.featuredImage || group.image} size={110} style={styles.avatar} />
        <H1>{plan.name}</H1>
      </View>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={threads}
        renderItem={({ item }) => <ThreadListItem item={item} group={group} type={item.type} />}
        keyExtractor={(item: ThreadItem) => `${item.id.toString()}`}
        getItemLayout={(_data, index) => ({ length: 220, offset: 220 * index + 12, index })}
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : (
            <EmptyData
              type="textIcon"
              text={I18n.t('text.No new study discussions')}
              subText={I18n.t('text.Study discussions from the daily study will appear here')}
              image={'💬'}
              style={styles.emptyData}
              iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
            />
          )
        }
        ListFooterComponent={<View style={styles.footer} />}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  emptyData: {
    marginTop: '25%',
  },
  footer: {
    height: 32,
  },
  planInfoWrapper: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 40,
    marginBottom: 20,
  },
  avatar: { marginBottom: 20 },
})

export default PlanDiscussionScreen
