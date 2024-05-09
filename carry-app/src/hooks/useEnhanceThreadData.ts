import { StudyPlan } from '@dts/study'
import firestore from '@react-native-firebase/firestore'
import { ThreadItem } from '@scenes/GroupActions/components/ThreadListItem'
import Firestore from '@shared/Firestore'
import collections from '@shared/Firestore/collections'
import { useCallback, useEffect, useRef, useState } from 'react'

const useUnThreadData = (groupId: string, rawUnreadThreadData?: App.UnreadThread[]) => {
  const [data, setData] = useState<ThreadItem[] | undefined>()

  const cachePlan = useRef<Record<string, StudyPlan.GroupPlan>>({})
  const getGroupPlan = useCallback(
    async (planId: string) => {
      if (cachePlan.current[planId]) {
        return cachePlan.current[planId]
      }
      const groupPlan = await Firestore.Group.getGroupPlan({ groupId, planId })
      if (groupPlan) {
        cachePlan.current[planId] = groupPlan
      }
      return groupPlan
    },
    [groupId],
  )

  const cacheThread = useRef<Record<string, App.Thread>>({})
  const getThread = useCallback(
    async (threadId: string) => {
      if (cacheThread.current[threadId]) {
        return cacheThread.current[threadId]
      }
      const thread = (
        await firestore().collection(collections.GROUPS).doc(groupId).collection(collections.THREADS).doc(threadId).get()
      )?.data() as App.Thread
      if (thread) {
        cacheThread.current[threadId] = thread
      }
      return thread
    },
    [groupId],
  )

  useEffect(() => {
    const run = async () => {
      if (!rawUnreadThreadData) {
        return
      }
      const enhanceThreads = await Promise.all(
        rawUnreadThreadData.map<Promise<ThreadItem>>(async unreadThread => {
          const [plan, thread] = await Promise.all([getGroupPlan(unreadThread.planId!), getThread(unreadThread.threadId)])
          return {
            ...thread,
            plan: plan!,
          }
        }),
      )
      setData(enhanceThreads.filter(thread => !!thread.plan))
    }
    run()
  }, [getGroupPlan, getThread, rawUnreadThreadData])

  return {
    loading: !data,
    data: data ?? [],
  }
}

export default useUnThreadData
