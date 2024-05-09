import ActionSteps from '@dts/actionSteps'
import { cancel, fork, take } from '@redux-saga/core/effects'
import { TYPES } from '@redux/actions'
import auth from '@react-native-firebase/auth'
import rsf from '@redux/sagas/rsf'
import collections from '@shared/Firestore/collections'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import Firestore from '@shared/Firestore'
import { RootState } from '@dts/state'

type LoadActionStepsType = {
  type: string
  payload: { isLoadMore?: boolean; isRefresh?: boolean; groupId: string }
}

type LoadFollowUpsType = {
  type: string
  payload: { isLoadMore?: boolean; isRefresh?: boolean; groupId: string; actionStepsId: string }
}

type MarkFollowUpAsReadType = {
  type: string
  payload: { groupId: string; actionStepsId: string; followUpId }
}

function* getActionStepsAction({ payload }: LoadActionStepsType) {
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }
  const { isLoadMore = false, isRefresh = false, groupId } = payload
  const existData: RootState['actionSteps'] = yield select(state => state.actionSteps)
  const lastItem = (!isRefresh && existData?.data?.[existData?.data?.length - 1]) || null

  const data = yield call(Firestore.ActionStep.getActionSteps, groupId, lastItem, { limit: 10, orderBy: 'updated' })
  yield put({
    type: TYPES.ACTION_STEPS.RECEIVE_DATA,
    payload: {
      data,
      isLoadMore,
      isRefresh,
    },
  })
}

function* getFollowUpsAction({ payload }: LoadFollowUpsType) {
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }
  const { isLoadMore = false, isRefresh = false, groupId, actionStepsId } = payload
  const existData: RootState['actionSteps'] = yield select(state => state.actionSteps)
  const lastItem = (!isRefresh && existData?.followUps?.[existData?.followUps?.length - 1]) || null
  yield put({ type: TYPES.ACTION_STEPS.MARK_AS_READ })
  const data = yield call(Firestore.ActionStep.getFollowUps, groupId, actionStepsId, lastItem, { limit: 10, orderBy: 'updated' })
  const followUps = data && data.map(it => ({ ...it, unread: !it?.viewers?.includes(user.uid) }))
  yield put({
    type: TYPES.FOLLOW_UPS.RECEIVE_DATA,
    payload: {
      data: followUps,
      isLoadMore,
      isRefresh,
    },
  })
}

function* markAsReadAction({ payload }: MarkFollowUpAsReadType) {
  const { groupId, actionStepsId, followUpId } = payload
  yield call(Firestore.ActionStep.updateFollowUpViewer, groupId, actionStepsId, followUpId)
}

type ViewAllActionStepActionType = {
  type: string
  payload: {
    ids: Array<string>
    actionStepId: string
  }
}

function* viewAllActionStepAction({ payload }: ViewAllActionStepActionType) {
  const { actionStepId, ids } = payload
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }
  yield put({
    type: TYPES.GROUP_ACTIONS.CLEAR,
  })
  const group: RootState['group'] = yield select(state => state.group)
  const result = yield call(Firestore.ActionStep.updateAllFollowUpViewer, group.id, actionStepId, ids)
  if (result.success) {
    yield put({
      type: TYPES.FOLLOW_UPS.LOAD,
      payload: {
        isLoadMore: false,
        isRefresh: true,
      },
    })
  }
}

type SyncActiveActionStep = {
  type: string
  payload: any
}
// eslint-disable-next-line no-empty-pattern
function* syncActiveActionStep({}: SyncActiveActionStep) {
  const user = auth().currentUser
  if (!user) {
    return
  }
  const group: RootState['group'] = yield select(state => state.group)
  const currentActiveActionStep: ActionSteps = yield call(Firestore.ActionStep.getActiveActionStep, group.id)
  if (!currentActiveActionStep) {
    return
  }

  const followUp = yield call(Firestore.ActionStep.getFollowUpForDailyFlow, group.id, currentActiveActionStep.id)
  yield put({
    type: TYPES.FOLLOW_UPS.RECEIVE_DAILY_FLOW,
    payload: {
      followUp,
    },
  })

  const activeActionStepWatcher = yield fork(
    rsf.firestore.syncDocument,
    `${collections.GROUPS}/${group.id}/${collections.ACTION_STEPS}/${currentActiveActionStep.id}`,
    {
      successActionCreator: snap => {
        const activeActionStep = snap.data() as ActionSteps
        return {
          type: TYPES.ACTION_STEPS.RECEIVE_ACTIVE_ACTION_STEP,
          payload: {
            activeActionStep,
          },
        }
      },
    },
  )

  // Clear sync task when open new group
  yield take(TYPES.ACTION_STEPS.SYNC_ACTIVE_ACTION_STEP)
  yield cancel(activeActionStepWatcher)
}

export default [
  takeLatest(TYPES.ACTION_STEPS.SYNC_ACTIVE_ACTION_STEP, syncActiveActionStep),
  takeLatest(TYPES.ACTION_STEPS.LOAD, getActionStepsAction),
  takeLatest(TYPES.FOLLOW_UPS.LOAD, getFollowUpsAction),
  takeLatest(TYPES.FOLLOW_UPS.MARK_AS_READ, markAsReadAction),
  takeLatest(TYPES.FOLLOW_UPS.VIEW_ALL, viewAllActionStepAction),
]
