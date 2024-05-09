import GroupActions, { GroupActionsType } from '@dts/groupAction'
import { RootState } from '@dts/state'
import auth from '@react-native-firebase/auth'
import { TYPES } from '@redux/actions'
import { Firestore } from '@shared/index'
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects'

type LoadActionType = {
  type: string
  payload: { type: GroupActionsType; isLoadMore?: boolean; isRefresh?: boolean }
}

function* loadGroupActions({ payload }: LoadActionType) {
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }
  const { type, isLoadMore = false, isRefresh = false } = payload
  const group: RootState['group'] = yield select(state => state.group)
  const groupActions: RootState['groupActions'] = yield select(state => state.groupActions)
  const latestCreatedTime =
    !isRefresh && isLoadMore && groupActions.data ? groupActions.data[groupActions.data.length - 1].created : undefined
  const { success, data } = yield call(Firestore.GroupActions.load, {
    groupId: group.id,
    type,
    latestCreatedTime,
  })
  if (!success) {
    toast.error('Load data failed! Please try again later...')
    return
  }

  // Filter any actions not created by current group members + inject user info
  const memberMap = group.channel?.state.members
  if (!memberMap) {
    toast.error('Load data failed! Please try again later...')
    return
  }

  const filterData: NonNullable<RootState['groupActions']['data']> = data
    .filter(item => !!memberMap[item.creator])
    .map((item: GroupActions) => {
      return {
        ...item,
        unread: !item.viewerIds.includes(user.uid),
        creatorInfo: {
          userId: item.creator,
          image: memberMap[item.creator].user!.image,
          name: memberMap[item.creator].user!.name,
        },
      }
    })

  yield put({
    type: TYPES.GROUP_ACTIONS.RECEIVE_DATA,
    payload: {
      data: filterData,
      isLoadMore,
    },
  })
}

type ViewGroupActionType = {
  type: string
  payload: {
    id: string
  }
}

function* viewGroupAction({ payload }: ViewGroupActionType) {
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }

  const group: RootState['group'] = yield select(state => state.group)

  const { id: groupActionId } = payload
  yield call(Firestore.GroupActions.view, group.id, groupActionId)
}

type ViewAllGroupActionType = {
  type: string
  payload: {
    ids: Array<string>
    type: GroupActionsType
  }
}

function* viewAllGroupAction({ payload }: ViewAllGroupActionType) {
  const { ids, type } = payload
  const user = auth().currentUser
  if (!user || !payload) {
    return
  }
  yield put({
    type: TYPES.GROUP_ACTIONS.CLEAR,
  })
  const group: RootState['group'] = yield select(state => state.group)
  const result = yield call(Firestore.GroupActions.viewAll, group.id, ids)
  if (result.success) {
    yield put({
      type: TYPES.GROUP_ACTIONS.LOAD,
      payload: {
        type,
        isLoadMore: false,
        isRefresh: true,
      },
    })
  }
}

export default [
  takeLatest(TYPES.GROUP_ACTIONS.LOAD, loadGroupActions),
  takeEvery(TYPES.GROUP_ACTIONS.VIEW, viewGroupAction),
  takeLatest(TYPES.GROUP_ACTIONS.VIEW_ALL, viewAllGroupAction),
]
