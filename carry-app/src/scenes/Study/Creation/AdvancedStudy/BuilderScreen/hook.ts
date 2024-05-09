import { GroupActionsType } from '@dts/groupAction'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import I18n from '@shared/I18n'
import { ReactNode, useCallback, useRef, useState } from 'react'

export const useBlockData = ({ initName, initActivities }: { initName?: string; initActivities?: StudyPlan.Activity[] }) => {
  const { custom } = useLayoutAnimation()
  const isEdited = useRef<boolean>(false)
  const [block, setBlock] = useState<StudyPlan.Block>(() => {
    return {
      name: initName || '',
      activities: initActivities || [],
    }
  })

  const updateBlock = useCallback(
    (newBlock: Partial<StudyPlan.Block>) => {
      isEdited.current = true
      setBlock({
        ...block,
        ...newBlock,
      })
    },
    [block],
  )

  const updateTitle = useCallback(
    (title: string) => {
      if (title !== block.name) {
        isEdited.current = true
        setBlock({
          ...block,
          name: title,
        })
      }
    },
    [block],
  )

  const addActivity = useCallback(
    (newActivity: StudyPlan.Activity) => {
      isEdited.current = true
      setBlock({
        ...block,
        activities: [...block.activities, newActivity],
      })
    },
    [block],
  )

  const updateActivity = useCallback(
    (newActivity: StudyPlan.Activity, index: number) => {
      isEdited.current = true
      setBlock({
        ...block,
        activities: block.activities.map((act, curIndex) => {
          return curIndex === index ? newActivity : act
        }),
      })
    },
    [block],
  )

  const removeActivity = useCallback(
    (index: number) => {
      isEdited.current = true
      custom()
      setBlock({
        ...block,
        activities: block.activities.filter((act, curIndex) => curIndex !== index),
      })
    },
    [block, custom],
  )

  const validateBlock = useCallback(() => {
    // eslint-disable-next-line no-unused-vars
    const actionCount: { [key in GroupActionsType]: number } = { prayer: 0, gratitude: 0 }

    for (const act of block.activities) {
      // Only allow maximum 1 prayer and 1 gratitude
      if (act.type === 'action') {
        actionCount[act.actionType]++
        if (actionCount[act.actionType] > 1) {
          return act.actionType === 'prayer'
            ? I18n.t('text.Only allow one prayer activity in a day')
            : I18n.t('text.Only allow one gratitude activity in a day')
        }
      }
    }
  }, [block.activities])

  return {
    block,
    isEdited,
    updateBlock,
    updateTitle,
    addActivity,
    updateActivity,
    removeActivity,
    validateBlock,
  }
}

export const useActivitySelectionModal = () => {
  const addNewActivity = async (): Promise<StudyPlan.Activity | undefined> => {
    return new Promise(resolve => {
      NavigationRoot.push(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_SELECTION_MODAL, {
        onCreate: (act: StudyPlan.Activity) => {
          resolve(act)
        },
        onDismiss: () => resolve(undefined),
      })
    })
  }

  return { addNewActivity }
}

export const useBuilderMoreOption = ({
  onDeleteBlock,
  headerComponent,
  pace,
}: {
  onDeleteBlock: () => void
  headerComponent: () => ReactNode
  pace: 'day' | 'week'
}) => {
  const { color } = useTheme()
  const Analytics = useAnalytic()

  const onPressTrash = () => {
    NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
      title: I18n.t('text.Confirm'),
      description: I18n.t('text.trash block'),
      confirmTitle: I18n.t('text.Yes continue'),
      cancelTitle: I18n.t('text.Cancel'),
      confirmColor: color.red,
      onConfirm: () => {
        Analytics.event(Constants.EVENTS.ADVANCED_GOAL.DELETE_STUDY_BLOCK)
        onDeleteBlock()
        NavigationRoot.pop()
      },
    })
  }

  const onPress = () => {
    NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
      item: null,
      handleActions: (action: string) => {
        switch (action) {
          case 'delete-block': {
            onPressTrash()
            break
          }
          default: {
            break
          }
        }
      },
      headerComponent,
      actions: [
        {
          title: I18n.t(`text.Delete ${pace}`),
          icon: 'trash-2',
          action: 'delete-block',
        },
      ],
    })
  }

  return {
    onPress,
  }
}
