import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import firestore from '@react-native-firebase/firestore'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import I18n from '@shared/I18n'
import { wait } from '@shared/Utils'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

/**
 * This hook will initialize plan state, provide update functions and auto sync back to
 * appropriate store (remote or onboarding redux)
 */
export const usePlanData = ({ defaultPlan, onAddedNewBlock }: { defaultPlan?: StudyPlan.UserPlan; onAddedNewBlock?: () => void }) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const isSyncRemote = !!defaultPlan && !!me.uid
  const dispatch = useDispatch()
  const [plan, setPlan] = useState<StudyPlan.UserPlan>(() => {
    if (defaultPlan) {
      return defaultPlan
    }
    const createdTime = firestore.FieldValue.serverTimestamp()
    return {
      id: 'draft-plan-id',
      author: 'draft-user-id',
      owner: 'draft-user-id',
      targetGroupId: 'draft-group-id',
      name: '',
      pace: 'day',
      duration: 0,
      state: 'draft',
      type: 'advanced',
      storeVisible: false,
      version: 1,
      created: createdTime,
      updated: createdTime,
      blocks: [],
    }
  })
  const lastLength = useRef(plan?.blocks?.length || 0)

  const updatePlan = useCallback(
    (partialPlan: Partial<StudyPlan.UserPlan>) => {
      let curPlan = plan
      setPlan(oldPlan => {
        curPlan = {
          ...oldPlan,
          ...partialPlan,
        }
        return curPlan
      })
      return curPlan
    },
    [plan],
  )

  const updateBlock = useCallback((value: StudyPlan.Block, blockIndex: number) => {
    setPlan(oldPlan => {
      const newBlocks =
        blockIndex === oldPlan.blocks.length
          ? [...oldPlan.blocks, value]
          : oldPlan.blocks.map((curBlock, index) => (index === blockIndex ? value : curBlock))
      return {
        ...oldPlan,
        blocks: newBlocks,
        duration: newBlocks.length,
      }
    })
  }, [])

  const deleteBlock = useCallback(
    (blockIndex: number) => {
      const newBlocks = plan.blocks.filter((value, index) => index !== blockIndex)
      setPlan({ ...plan, blocks: newBlocks, duration: newBlocks.length })
    },
    [plan],
  )

  const updateTitle = useCallback(
    (value: string) => {
      if (value !== plan.name) {
        setPlan({ ...plan, name: value })
      }
    },
    [plan],
  )

  // auto sync plan to store
  useEffect(() => {
    ;(async () => {
      if (!isSyncRemote) {
        dispatch({ type: TYPES.ONBOARDING.SET_ADVANCED_STUDY_PLAN, advancedPlan: plan })
        return
      }
      console.log('call to sync', plan)
      const result = await Firestore.Study.updateAdvancedStudyDraft(plan)
      if (!result) {
        toast.error(I18n.t('error.Unable to update draft'))
      }
    })()
  }, [dispatch, isSyncRemote, plan, plan.pace])

  useEffect(() => {
    if (lastLength.current < plan?.blocks?.length) {
      onAddedNewBlock?.()
    }
    lastLength.current = plan?.blocks?.length
  }, [onAddedNewBlock, plan?.blocks?.length])

  return {
    plan,
    updatePlan,
    updateBlock,
    deleteBlock,
    updateTitle,
  }
}

export const usePublishAndApplyPlan = ({
  plan,
  updatePlan,
  isSharedOrgPlan = false,
}: {
  plan: StudyPlan.UserPlan
  updatePlan: (updatedPlan: Partial<StudyPlan.UserPlan>) => StudyPlan.UserPlan
  isSharedOrgPlan?: boolean
}) => {
  const dispatch = useDispatch()
  const { showLoading, hideLoading } = useLoading()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)

  const validatePlan = useCallback((): string | undefined => {
    if (!plan.name) {
      return I18n.t('error.Study name cannot empty')
    } else if (plan.blocks?.length === 0) {
      return I18n.t('error.Please add study block')
    }
    const Pace = plan.pace.charAt(0).toUpperCase() + plan.pace.slice(1)
    for (let blockIndex = 0; blockIndex < plan.blocks?.length; blockIndex++) {
      const block = plan.blocks[blockIndex]
      if (!block.name) {
        I18n.t('error.Block have no title', {
          blockValue: `${I18n.t(`text.${Pace}`)} ${blockIndex + 1}`,
        })
      } else if (block.activities.length === 0) {
        I18n.t('error.Block empty', { paceValue: I18n.t(`text.${Pace}`), blockIndex: blockIndex + 1 })
      }
      for (let index = 0; index < block.activities.length; index++) {
        const activity = block.activities[index]
        // @ts-ignore
        if (activity?.error) {
          I18n.t('error.Activity not valid', {
            activity: index + 1,
            pace: I18n.t(`text.${Pace}`),
            blockIndex: blockIndex + 1,
          })
        }
      }
    }
  }, [plan])

  const requestPublish = useCallback(
    async startTime => {
      const userPlan = updatePlan({ state: 'completed' })
      if (userPlan) {
        const groupPlan = await Firestore.Study.applyStudyPlanToGroup(group.id, userPlan, startTime)
        if (groupPlan) {
          NavigationRoot.replace(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_PUBLISH, {
            groupPlan,
            isSharedOrgPlan,
          })

          return
        } else {
          toast.error(I18n.t('error.Unable to publish study'))
        }
      }
    },
    [group.id, isSharedOrgPlan, updatePlan],
  )

  const handlePublishGoal = useCallback(
    async start => {
      const error = validatePlan()
      if (error) {
        toast.error(error)
        return
      }

      if (!me.uid) {
        dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: start })
        updatePlan({ state: 'completed' })
        NavigationRoot.navigate(Constants.SCENES.ONBOARDING.LOGIN, {
          isCreateGroup: true,
          groupInfo: {
            id: onboarding.groupId,
            name: onboarding.groupName,
            avatar: onboarding.groupAvatar?.url,
            members: [],
          },
        })
        return
      }

      showLoading()
      const checkOverlapResp = await Firestore.Study.checkOverlapPlans(group.id, start.getTime(), plan.duration, plan.pace)
      if (checkOverlapResp.data?.length) {
        const overlappedCurrentActivePlan = checkOverlapResp.data.some(i => i.id === group?.activeGoal?.id)
        hideLoading()
        const isConfirm = await new Promise(resolve => {
          const description = !overlappedCurrentActivePlan
            ? I18n.t('text.Your selected start date overlaps with a future study. Do you want to replace that future study')
            : I18n.t('text.Your selected start date overlaps with your current study. Do you want to replace your current study')
          NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
            titleIconText: '✋',
            title: I18n.t('text.Just checking'),
            description,
            confirmTitle: I18n.t('text.Yes replace it'),
            cancelTitle: I18n.t('text.Cancel'),
            onConfirm: async () => {
              resolve(true)
            },
            onCancel: () => {
              resolve(false)
            },
          })
        })
        if (!isConfirm) {
          return
        } else {
          showLoading()
        }
      }
      await requestPublish(start)
      hideLoading()
    },
    [
      validatePlan,
      me.uid,
      showLoading,
      group.id,
      group.activeGoal?.id,
      plan.duration,
      requestPublish,
      hideLoading,
      dispatch,
      updatePlan,
      onboarding.groupId,
      onboarding.groupName,
      onboarding.groupAvatar?.url,
    ],
  )

  return {
    handlePublishGoal,
  }
}

export const useMainBuilderMoreOption = ({
  plan,
  updatePlan,
  headerComponent,
}: {
  plan: StudyPlan.UserPlan
  updatePlan: any
  headerComponent: ReactNode
}) => {
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { showLoading, hideLoading } = useLoading()
  const { color } = useTheme()
  const Analytics = useAnalytic()

  const onPressTrash = () => {
    NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
      title: I18n.t('text.Confirm'),
      description: I18n.t('text.trash study'),
      confirmTitle: I18n.t('text.Yes delete'),
      cancelTitle: I18n.t('text.Cancel'),
      confirmColor: color.red,
      onConfirm: async () => {
        if (!me.uid) {
          dispatch({
            type: TYPES.ONBOARDING.SET_ADVANCED_STUDY_PLAN,
            advancedPlan: undefined,
          })
          toast.success(I18n.t('text.Remove study successfully'))
          await wait(250)
          NavigationRoot.pop()
          return
        }

        showLoading()
        // TODO: if group owner delete a plan in org plan tab they will
        //  just remove the link in sharedPlans collection
        if (plan.owner !== me.uid) {
          hideLoading()
          toast.error(I18n.t(`text.Permission denied Failed to delete study plan`))
        }
        const isSuccess = await Firestore.Study.deleteUserStudy(plan.id)
        hideLoading()
        if (!isSuccess) {
          toast.error(I18n.t('error.Unable to delete study'))
        } else {
          Analytics.event(Constants.EVENTS.ADVANCED_GOAL.DELETE_STUDY)
          toast.success(I18n.t('text.Remove study successfully'))
          await wait(250)
          NavigationRoot.pop()
        }
      },
    })
  }

  const onPress = () => {
    NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
      item: null,
      handleActions: (action: string) => {
        switch (action) {
          case 'delete-plan': {
            onPressTrash()
            break
          }
          case 'change-pace': {
            updatePlan?.({ pace: plan.pace === 'day' ? 'week' : 'day' })
            break
          }
          default: {
            break
          }
        }
      },
      headerComponent,
      actions: [
        ...(plan.blocks.length > 0
          ? [
              {
                title: I18n.t(`Change pace to ${plan.pace === 'day' ? 'week' : 'day'}`),
                icon: 'repeat',
                action: 'change-pace',
              },
            ]
          : []),
        {
          title: I18n.t('text.Delete plan'),
          icon: 'trash-2',
          action: 'delete-plan',
        },
      ],
    })
  }

  return {
    onPress,
  }
}
