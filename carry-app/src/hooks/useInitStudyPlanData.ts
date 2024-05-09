import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLoading from '@hooks/useLoading'
import { StreamIO } from '@shared/index'
import Firestore from '@shared/Firestore'
import Utils from '@shared/Utils'

const useInitStudyPlanData = () => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const [plan, setPlan] = useState<StudyPlan.GroupPlan | null>()
  const [blockIndex, setBlockIndex] = useState<number>(0) // Start from 1
  const [completedMembers, setCompletedMembers] = useState<string[]>([])
  const [groupMembers, setGroupMembers] = useState<any>()
  const [channel, setChannel] = useState<any>()
  const { showLoading, hideLoading } = useLoading()
  const [progress, setProgress] = useState<{ [bIndex: string]: StudyPlan.UserProgress } | null>()
  const groupId = group.id
  const planId = group.activeGoal?.id || ''
  const unSubPlan = useRef<any>()
  const currentPlanId = useRef('')

  useEffect(() => {
    const c = StreamIO.client.channel('messaging', groupId)
    setChannel(c)
    setGroupMembers(c?.state?.members ? Object.values(c?.state?.members) : [])
  }, [groupId])

  // Sync active goal
  useEffect(() => {
    if (!groupId || !planId) {
      setPlan(null)
      return
    }

    if (currentPlanId.current !== planId) {
      currentPlanId.current = planId
      if (unSubPlan.current) unSubPlan.current()
    }

    const ref = Firestore.Group.planRef(groupId, planId)
    unSubPlan.current = ref?.onSnapshot(snap => {
      if (snap) {
        const planData: any = snap.data()
        if (planData && planData.status !== 'ended') {
          const currentBlock = Utils.getBlockIndexOfPlan(planData)
          if (currentBlock.blockIndex === 0) {
            setBlockIndex(0)
            setPlan(planData)
          } else if (currentBlock.isOverdue) {
            setPlan(null)
          } else {
            setBlockIndex(currentBlock.blockIndex)
            setPlan(planData)
            Firestore.Group.triggerCreateMessage(planData, currentBlock.blockIndex, showLoading, hideLoading)
          }
        } else {
          setPlan(null)
        }
      } else {
        setPlan(null)
      }
    })
    return () => {
      if (unSubPlan.current) unSubPlan.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, planId])

  // Sync Progress
  useEffect(() => {
    if (!me.uid || !groupId || !planId || !blockIndex) {
      setProgress(null)
      return
    }
    const ref = Firestore.Study.getUserProgressRef(me.uid, groupId, planId)
    const unsubscribe = ref?.onSnapshot(snap => {
      if (snap) {
        const progressData = {}
        snap.docs.forEach(snapItem => {
          const item = snapItem.data() as StudyPlan.UserProgress
          progressData[`${item.blockIndex}`] = item
        })
        setProgress(progressData)
      } else {
        setProgress(null)
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId, planId, me.uid, blockIndex])

  useEffect(() => {
    if (!groupId || !planId) return
    if (!plan || !plan.memberProgress) return
    const members = Object.keys(plan.memberProgress)
    const memberDone = members.filter(uid => plan?.memberProgress[uid]?.isCompleted)
    setCompletedMembers(memberDone)
  }, [plan?.memberProgress, groupId, plan, planId])

  return {
    groupName: group.name,
    groupId,
    plan,
    channel,
    blockIndex,
    completedMembers,
    progress,
    groupMembers,
  }
}

export default useInitStudyPlanData
