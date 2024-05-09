import { RootState } from '@dts/state'
import useMemberActivityPrompt, { MemberActivityPromptType } from '@hooks/useMemberActivityPrompt'
import usePrevious from '@hooks/usePrevious'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore, LocalStorage } from '@shared/index'
import { LAST_DISPLAY_LEADER_REVIEW, LAST_DISPLAY_WEEKLY_REVIEW } from '@shared/LocalStorage'
import { showRequestReviewPrompts } from '@shared/ModalUtils'
import { getDay } from 'date-fns'
import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'

const useFinishDailyFlowAnimation = ({
  triggerFinishStudyAnimation,
  me,
  group,
  isFinishedStudy,
}: {
  triggerFinishStudyAnimation: (value?: boolean) => void
  me: RootState['me']
  group: RootState['group']
  isFinishedStudy: boolean
}) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const shouldTriggerFinishStudyAnimation = useRef(false)
  const memberActivityPromptData = useRef<MemberActivityPromptType | null>(null)
  const shouldShowOverlay = me.buttonOverlayGroups?.includes(group.id)
  const { checkShowMemberActivityPrompt } = useMemberActivityPrompt()
  const { color } = useTheme()

  React.useEffect(() => {
    // In this event we handle many popups/modals that appeared when user go back to home
    const unsubscribe = navigation.addListener('focus', async () => {
      // [Top priority] If user just finish TODAY daily flow, we'll show an animation on the CTA button at HomeScreen
      if (shouldTriggerFinishStudyAnimation.current) {
        shouldTriggerFinishStudyAnimation.current = false
        await triggerFinishStudyAnimation()
      }
      // [Second priority] Show an invite modal when the leader create a new group and first time enter HomeScreen
      // This modal only show 1 time for each group so it has high priority

      if (global.SHOW_INVITE_MODAL_CREATE_GROUP) {
        global.SHOW_INVITE_MODAL_CREATE_GROUP = false
        global.MODAL_S
        setTimeout(() => {
          !shouldShowOverlay && NavigationRoot.push(Constants.SCENES.MODAL.SHARE_GROUP)
        }, 250)
        return
      }

      // Below logic handle the order/priority of each modal after user finish daily flow
      if (global.JUST_COMPLETED_DAILY_FLOW && NavigationRoot.getCurrentScreen().name === 'HomeTab') {
        if (!global.MODAL_FINISHED) global.MODAL_FINISHED = []
        // [1st priority] This invite modal will show for every user after their 1st time finish the daily flow
        // Only show 1 time for each group, that's why it priorities more than other modal
        if (!me.shareGroupModalShownInGroups?.[group.id] && !global.MODAL_FINISHED.includes('ShareGroup')) {
          global.MODAL_FINISHED.push('ShareGroup')
          NavigationRoot.navigate(Constants.SCENES.MODAL.SHARE_GROUP)
          dispatch({
            type: TYPES.ME.UPDATE,
            payload: {
              shareGroupModalShownInGroups: {
                ...(me.shareGroupModalShownInGroups ?? {}),
                [group.id]: true,
              },
            },
          })
          return
        }

        // [Unknown priority] If there are some Prayer or Gratitude not review yet. For every members.
        if (
          (group.groupActions.prayer.unreadCount > 0 || group.groupActions.gratitude.unreadCount > 0) &&
          !global.MODAL_FINISHED.includes('ReviewPrompt')
        ) {
          global.MODAL_FINISHED.push('ReviewPrompt')
          showRequestReviewPrompts({
            type: group.groupActions.prayer.unreadCount >= group.groupActions.gratitude.unreadCount ? 'prayer' : 'gratitude',
            actions: group.groupActions,
            channelMembers: group.channelMembers,
            color: color,
            dispatch,
          })
          return
        }

        // [2nd priority] This weekly review modal show every Monday for every members in group
        try {
          const day = getDay(Date.now())
          const lastShowReviewDiff = await LocalStorage.getDifferenceInHours(LAST_DISPLAY_WEEKLY_REVIEW)
          // Only show on Monday
          if (day === 1 && (lastShowReviewDiff === -1 || lastShowReviewDiff > 24)) {
            await LocalStorage.saveTime(LAST_DISPLAY_WEEKLY_REVIEW)
            const weeklyReviewData = await Firestore.Group.getWeeklyReview(group.id)
            setTimeout(() => {
              NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.WEEKLY_REVIEW, {
                weeklyReviewData,
              })
            }, 250)
            return
          }
        } catch (e) {
          // do nothing
        }

        // [3rd priority] This modal show every 3 days (except for monday) for leader only
        const lastShowLeaderReviewDiff = await LocalStorage.getDifferenceInHours(LAST_DISPLAY_LEADER_REVIEW)
        if (memberActivityPromptData.current && (lastShowLeaderReviewDiff === -1 || lastShowLeaderReviewDiff > 24)) {
          await LocalStorage.saveTime(LAST_DISPLAY_LEADER_REVIEW)
          const data = memberActivityPromptData.current
          memberActivityPromptData.current = null
          setTimeout(() => {
            NavigationRoot.push(Constants.SCENES.MODAL.MEMBER_ACTIVITY_PROMPT, {
              user: data.user,
              mode: data.mode,
            })
          }, 250)
          return
        }

        global.MODAL_FINISHED = []
        global.JUST_COMPLETED_DAILY_FLOW = false
      }
    })
    return () => {
      unsubscribe()
    }
  }, [navigation, triggerFinishStudyAnimation, me, group.id, dispatch, shouldShowOverlay, color, group])

  const prevIsFinishedStudy = usePrevious(isFinishedStudy)
  React.useEffect(() => {
    if (prevIsFinishedStudy === false && isFinishedStudy === true) {
      shouldTriggerFinishStudyAnimation.current = true
      checkShowMemberActivityPrompt().then(({ shouldShow, data }) => {
        if (shouldShow && data) {
          memberActivityPromptData.current = data
        }
      })
    } else if (prevIsFinishedStudy === true && isFinishedStudy === true && !shouldTriggerFinishStudyAnimation.current) {
      // Show the blue check dot instantly
      triggerFinishStudyAnimation(false)
    }
  }, [prevIsFinishedStudy, isFinishedStudy, triggerFinishStudyAnimation, checkShowMemberActivityPrompt])
}

export default useFinishDailyFlowAnimation
