import GroupActions, { GroupActionsType } from '@dts/groupAction'
import { RootState } from '@dts/state'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { call, cancel, fork, put, select, take, takeLatest } from '@redux-saga/core/effects'
import { TYPES } from '@redux/actions'
import store from '@redux/store'
import collections from '@shared/Firestore/collections'
import rsf from './rsf'
import { isAfter, sub } from 'date-fns'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore } from '@shared/index'
import { getDateFromFirestoreTime } from '@shared/Utils'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import Toast from '@components/Toast'
import I18n from 'i18n-js'
import { RolesCanCreateGroup } from '@shared/Constants'

function* syncGroup({ payload }: { type: string; payload: string }) {
  const user = auth().currentUser
  let isReset = false
  if (!user || !payload) {
    return
  }

  const groupID = payload

  devLog('OPEN GROUP', payload, 'BY USER', user.uid)
  Smartlook.trackCustomEvent(CUSTOM_EVENTS.OPEN_GROUP, { groupID })

  yield put({
    type: TYPES.SCREEN.SHOW_LOADING,
    payload: {},
  })

  const me: RootState['me'] = yield select(state => state.me)

  const checkNavigate = async () => {
    if (global.USER_DELETED) return

    if (RolesCanCreateGroup.includes(me.organisation?.role || '')) {
      return NavigationRoot.reset({ index: 0, routes: [{ name: Constants.SCENES.LAUNCH.BIBLE_GROUPS }] })
    }
    const groups = await Firestore.Group.getUsersGroup()
    // If user doesn't have any group we will navigate them to the JoinAGroup screen
    if (groups.length === 0) {
      return NavigationRoot.replace(Constants.SCENES.ONBOARDING.JOIN_A_GROUP)
    }
  }

  const groupWatcher = yield fork(rsf.firestore.syncDocument, `${collections.GROUPS}/${groupID}`, {
    successActionCreator: snap => {
      try {
        let groupData = snap.data()
        const isInGroup = groupData?.members?.includes(user.uid)
        if (groupData && isInGroup) {
          groupData = {
            ...groupData,
          }
          store.store.dispatch({
            type: TYPES.ORGANISATION.GET_ORG,
            payload: { campusId: groupData.organisation?.campusId, orgId: me.organisation?.id },
          })
          return { type: TYPES.GROUP.UPDATE, payload: { ...groupData, isOwner: user.uid === groupData.owner } }
        }
        if (!isReset && !global.FLAG_LOGOUT) {
          isReset = true
          if (!isInGroup && !global.USER_DELETED) {
            Toast.error(I18n.t('error.You are not a member of the group'))
          }
          checkNavigate()
        }
        return { type: TYPES.GROUP.CLOSE_GROUP_SCREEN }
      } finally {
        if (!global.DELETING_USER && store.store.getState().screen.loading) {
          store.store.dispatch({
            type: TYPES.SCREEN.HIDE_LOADING,
            payload: {},
          })
        }
      }
    },
  })

  yield put({
    type: TYPES.GROUP.LOAD_SCORE,
    payload: {
      groupId: groupID,
    },
  })

  yield call(rsf.firestore.updateDocument, `users/${user.uid}`, 'latestJoinedGroup', groupID)
  yield put({
    type: TYPES.GROUP.RESET_DIRECT_MESSAGES_UNREAD_COUNT,
  })

  yield put({
    type: TYPES.GROUP.GET_UNREAD_DISCUSSIONS,
  })

  yield put({
    type: TYPES.ACTION_STEPS.SYNC_ACTIVE_ACTION_STEP,
  })

  // Clear sync task when open new group
  yield take(TYPES.GROUP.OPEN_GROUP_SCREEN)
  yield cancel(groupWatcher)
  global.FLAG_LOGOUT = false
}

function* syncActions() {
  const user = auth().currentUser
  if (!user) {
    return
  }

  const groupId = yield select(state => state.group.id)
  const beginningOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const checkDate = firestore.Timestamp.fromDate(sub(beginningOfToday, { days: 7 }))
  const startOfPreviousDate = sub(beginningOfToday, { days: 1 })

  // @ts-ignore
  const discussionWatcher = yield fork(rsf.firestore.syncCollection, Firestore.Group.unreadThreadsRef(groupId)!, {
    successActionCreator: snap => {
      return {
        type: TYPES.GROUP.UPDATE,
        payload: {
          discussionCount: snap.docs.length,
        },
      }
    },
    failureActionCreator: error => console.error(error),
  })

  const groupActionsWatcher = yield fork(
    rsf.firestore.syncCollection,
    firestore().collection(`${collections.GROUPS}/${groupId}/${collections.ACTIONS}`).where('created', '>', checkDate).limit(100),
    {
      successActionCreator: snap => {
        const groupActions: {
          // eslint-disable-next-line no-unused-vars
          [key in GroupActionsType]: {
            data: NonNullable<RootState['groupActions']['data']>
            recentlyCreated: NonNullable<RootState['groupActions']['data']>
            unreadCount: number
            createdCount: number
          }
        } = {
          prayer: { data: [], recentlyCreated: [], unreadCount: 0, createdCount: 0 },
          gratitude: { data: [], recentlyCreated: [], unreadCount: 0, createdCount: 0 },
        }
        const recentlyCreated: {
          prayer: NonNullable<RootState['groupActions']['data']>
          gratitude: NonNullable<RootState['groupActions']['data']>
        } = {
          prayer: [],
          gratitude: [],
        }

        snap.forEach(doc => {
          const data = doc.data() as GroupActions
          // Need to access the store directly here bc can't yield select in here
          const group = store.store.getState().group as RootState['group']
          const memberMap = group.channel?.state.members
          if (!memberMap[data.creator]) {
            return
          }

          const action = {
            ...data,
            unread: true,
            creatorInfo: {
              userId: data.creator,
              image: memberMap[data.creator].user!.image as string,
              name: memberMap[data.creator].user!.name as string,
            },
          }

          if (!data.viewerIds.includes(user.uid)) {
            groupActions[data.type].unreadCount++
            groupActions[data.type].data.push(action)
          }
          // Count how many actions that user created from previous day to today.
          if (data.creator === user.uid && isAfter(getDateFromFirestoreTime(data.created), startOfPreviousDate)) {
            groupActions[data.type].createdCount++
          }
          //@ts-ignore
          else if (data.created.seconds > firestore.Timestamp.fromDate(beginningOfToday).seconds && data.creator !== user.uid) {
            recentlyCreated[data.type].push(action)
          }
        })

        groupActions.prayer.recentlyCreated = recentlyCreated.prayer
        groupActions.gratitude.recentlyCreated = recentlyCreated.gratitude

        return {
          type: TYPES.GROUP.UPDATE,
          payload: {
            groupActions,
          },
        }
      },
    },
  )

  // Clear sync task when open new group
  yield take(TYPES.GROUP.OPEN_GROUP_SCREEN)
  yield cancel(groupActionsWatcher)
  yield cancel(discussionWatcher)
}

function* loadScore({ payload }: { type: string; payload: { groupId: string } }) {
  const score = yield call(Firestore.Group.getGroupScore, payload.groupId)
  yield put({
    type: TYPES.GROUP.UPDATE,
    payload: {
      score,
    },
  })
}

export default [
  takeLatest(TYPES.GROUP.OPEN_GROUP_SCREEN, syncGroup),
  takeLatest(TYPES.GROUP.SYNC_ACTIONS, syncActions),
  takeLatest(TYPES.GROUP.LOAD_SCORE, loadScore),
]
