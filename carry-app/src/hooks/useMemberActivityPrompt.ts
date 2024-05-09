import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getDay, differenceInDays } from 'date-fns'
import { sortBy } from 'lodash'

import { RootState } from '@dts/state'
import { Firestore } from '@shared/index'

export type MemberActivityPromptType = {
  mode: 'key_contributor' | 'quite_member'
  user: {
    id: string
    name: string
    avatar: string
  }
}

const useMemberActivityPrompt = () => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { latestMemberActivityPromptModalShow } = me

  const getMemberActivityPromptData = useCallback(async (): Promise<MemberActivityPromptType | null> => {
    const score = await Firestore.Group.getGroupScore(group.id)
    if (!score) {
      return null
    } else {
      let scoreList = Object.entries(score).filter(([userId]) => !!group.channel?.state.members[userId] && userId !== me.uid)
      scoreList = sortBy(scoreList, ([_, { total }]) => total)
      if (scoreList.length === 0) {
        return null
      }
      const lowestScoreMember = scoreList[0]
      const highestScoreMember = scoreList[scoreList.length - 1]
      // Check quite member
      // TODO: revert to 11 when commit
      if (lowestScoreMember[1].total <= 50) {
        const userInfo = group.channel?.state.members[lowestScoreMember[0]]
        return {
          mode: 'quite_member',
          user: {
            id: userInfo.user_id as string,
            avatar: userInfo.user!.image as string,
            name: userInfo.user!.name as string,
          },
        }
      }
      // Check key member
      if (highestScoreMember[1].total >= 75) {
        const userInfo = group.channel?.state.members[highestScoreMember[0]]
        return {
          mode: 'key_contributor',
          user: {
            id: userInfo.user_id as string,
            avatar: userInfo.user!.image as string,
            name: userInfo.user!.name as string,
          },
        }
      }

      return null
    }
  }, [group.channel?.state.members, group.id, me.uid])

  const checkShowMemberActivityPrompt = useCallback(async (): Promise<{ shouldShow: boolean; data?: MemberActivityPromptType }> => {
    const now = Date.now()
    if (!group.isOwner) {
      return {
        shouldShow: false,
      }
    }

    const day = getDay(now)
    // Don't show on Monday
    if (day === 1) {
      return {
        shouldShow: false,
      }
    }

    // Don't show modal again in 3 days
    if (latestMemberActivityPromptModalShow && Math.abs(differenceInDays(latestMemberActivityPromptModalShow, now)) < 3) {
      return {
        shouldShow: false,
      }
    }

    const data = await getMemberActivityPromptData()
    if (data) {
      return {
        shouldShow: true,
        data,
      }
    }

    return {
      shouldShow: false,
    }
  }, [getMemberActivityPromptData, group.isOwner, latestMemberActivityPromptModalShow])

  return {
    checkShowMemberActivityPrompt,
  }
}

export default useMemberActivityPrompt
