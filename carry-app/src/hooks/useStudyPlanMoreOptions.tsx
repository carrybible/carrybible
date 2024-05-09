import ConfirmDialog, { ConfirmDialogRef } from '@components/ConfirmDialog'
import DatePicker from '@components/DatePicker'
import { Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLoading from '@hooks/useLoading'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore } from '@shared/index'
import Utils, { getDateFromFirestoreTime } from '@shared/Utils'
import { compareAsc } from 'date-fns'
import I18n from 'i18n-js'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'

const DEFAULT_STUDY_PLAN_MORE_OPTIONS = {
  onPress: undefined,
  renderPopup: () => null,
}

const OPTIONS = {
  CHANGE_QUESTION: 'change_question',
  END_GOAL: 'end_goal',
  DELETE_GOAL: 'delete_goal',
  CHANGE_REMINDER_TIME: 'change_reminder_time',
  CHANGE_START_DATE: 'change_start_date',
  CANCEL_GOAL: 'cancel_goal',
}

const useStudyPlanMoreOptions = ({
  plan,
  onStudyDelete,
  onStudyEnd,
}: {
  plan: StudyPlan.GroupPlan | null
  onStudyDelete?: () => void
  onStudyEnd?: () => void
}): {
  onPress?: () => void
  renderPopup: () => React.ReactNode
} => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { name } = group
  const Analytics = useAnalytic()

  const { showLoading, hideLoading } = useLoading()
  const confirmEndGoalDialogRef = useRef<ConfirmDialogRef | null>(null)
  const confirmDeleteGoalDialogRef = useRef<ConfirmDialogRef | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const actions = useMemo(() => {
    if (!plan) {
      return []
    }

    // setup actions list for owner
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = getDateFromFirestoreTime(plan.startDate)

    const result: { title: string; icon: string; action: string }[] = []
    const changeStartDateAction = { title: I18n.t('text.Change start date'), icon: 'calendar', action: OPTIONS.CHANGE_START_DATE }
    const endGoalAction = { title: I18n.t('text.End goal'), icon: 'stop-circle', action: OPTIONS.END_GOAL }
    const changeReminderAction = { title: I18n.t('text.Change reminder time'), icon: 'bell', action: OPTIONS.CHANGE_REMINDER_TIME }
    const deleteGoalAction = { title: I18n.t('text.Delete goal'), color: 'red', icon: 'x', action: OPTIONS.DELETE_GOAL, size: 22 }
    const cancelGoalAction = { title: I18n.t('text.Cancel study'), icon: 'stop-circle', action: OPTIONS.CANCEL_GOAL }

    if (group.isOwner) {
      if (plan.status === Constants.PREVIEW_STATUS.AVAILABLE && compareAsc(today, startDate) === -1) {
        result.push(changeStartDateAction)
      }

      // end goal action
      if (![Constants.PREVIEW_STATUS.ENDED, Constants.PREVIEW_STATUS.FUTURE].includes(plan.status)) {
        result.push(endGoalAction)
      }

      // change reminder time
      if (plan.status === Constants.PREVIEW_STATUS.AVAILABLE) {
        result.push(changeReminderAction)
      }

      // delete action
      if (plan.status === Constants.PREVIEW_STATUS.ENDED) {
        result.push(deleteGoalAction)
      }

      if (plan.status === Constants.PREVIEW_STATUS.FUTURE) {
        result.push(cancelGoalAction)
      }
    } else if (plan.status === Constants.PREVIEW_STATUS.AVAILABLE) {
      result.push(changeReminderAction)
    }

    return result
  }, [group.isOwner, plan])

  const onPress = useCallback(() => {
    NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
      item: null,
      handleActions: (action: string) => {
        switch (action) {
          case OPTIONS.END_GOAL: {
            confirmEndGoalDialogRef.current?.open()
            break
          }
          case OPTIONS.DELETE_GOAL: {
            confirmDeleteGoalDialogRef.current?.open()
            break
          }
          case OPTIONS.CHANGE_REMINDER_TIME: {
            NavigationRoot.push(Constants.SCENES.GROUP.REMINDER)
            break
          }
          case OPTIONS.CHANGE_START_DATE: {
            setDatePickerOpen(true)
            break
          }
          case OPTIONS.CANCEL_GOAL: {
            confirmEndGoalDialogRef.current?.open()
            break
          }
        }
      },
      headerStyle: { height: 75 },
      headerComponent: () => <Text style={styles.bottomActionHeader}>{name}</Text>,
      actions,
    })
  }, [actions, name])

  const renderPopup = () => (
    <>
      <ConfirmDialog
        ref={confirmEndGoalDialogRef}
        title={I18n.t('text.Confirm')}
        message={
          plan?.status === Constants.PREVIEW_STATUS.FUTURE
            ? I18n.t('text.Do you want to cancel this goal')
            : I18n.t('text.Do you want to end this goal')
        }
        onOkPress={async () => {
          try {
            confirmEndGoalDialogRef.current?.close()
            showLoading()
            if (plan?.status === Constants.PREVIEW_STATUS.FUTURE) {
              await Firestore.Study.removeFuturePlan(group.id, plan.id)
              const planRef = Firestore.Study.planCollectionref(group.id)
              Utils.checkScheduleFuturePlan(planRef, group)
              hideLoading()
              onStudyEnd?.()
              toast.success(I18n.t('text.Study ended'))
            } else {
              const result = await Firestore.Study.endGroupStudy(group.id || '', plan?.id || '')
              hideLoading()
              if (result) {
                Analytics.event(Constants.EVENTS.GOAL.ENDED_GOAL)
                onStudyEnd?.()
                toast.success(I18n.t('text.Study ended'))
              } else {
                toast.error(I18n.t('error.Unable to end study'))
              }
            }
          } catch (e) {
            toast.error(I18n.t('error.Unable to end study'))
            hideLoading()
          }
        }}
      />
      <ConfirmDialog
        ref={confirmDeleteGoalDialogRef}
        title={I18n.t('text.Confirm')}
        message={I18n.t('text.Do you want to delete this goal')}
        onOkPress={async () => {
          try {
            confirmDeleteGoalDialogRef.current?.close()
            showLoading()
            const result = await Firestore.Study.deleteGroupStudy(group.id || '', plan?.id || '')
            hideLoading()
            if (result) {
              onStudyDelete?.()
              toast.success(I18n.t('text.Study deleted'))
            } else {
              toast.error(I18n.t('error.Unable to delete study'))
            }
          } catch (e) {
            toast.error(I18n.t('error.Unable to delete study'))
            hideLoading()
          }
        }}
      />
      <DatePicker
        isVisible={datePickerOpen}
        handleDismiss={async value => {
          setDatePickerOpen(false)
          if (!value) return
          try {
            showLoading()
            const stateDate = value as Date
            stateDate.setHours(0, 0, 0, 0)
            const result = await Firestore.Study.updateStartTimeGroupStudy(group.id || '', plan?.id || '', stateDate)
            hideLoading()
            if (result) {
              toast.success(I18n.t('text.Start time is updated'))
            } else {
              toast.success(I18n.t('error.Unable to update start time'))
            }
          } catch (e) {
            toast.success(I18n.t('error.Unable to update start time'))
            hideLoading()
          }
        }}
        current={undefined}
        title={I18n.t('text.Choose a start date')}
        confirm={I18n.t('text.Confirm')}
        minimumDate={new Date()}
      />
    </>
  )

  if (actions.length > 0) {
    return {
      onPress,
      renderPopup,
    }
  }

  return DEFAULT_STUDY_PLAN_MORE_OPTIONS
}

const styles = StyleSheet.create({
  bottomActionHeader: {
    fontWeight: '700',
    maxHeight: 50,
  },
})

export default useStudyPlanMoreOptions
