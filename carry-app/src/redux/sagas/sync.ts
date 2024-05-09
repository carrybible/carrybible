import { RootState } from '@dts/state'
import AsyncStorage from '@react-native-async-storage/async-storage'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { Firestore, Reminder } from '@shared/index'
import I18n from 'i18n-js'
import { call, cancel, fork, put, select, take, takeLatest } from 'redux-saga/effects'
import { TYPES } from '../actions'
import rsf from './rsf'

const transformCollectionToArray = (collection: any) => {
  const docs: Array<any> = []
  if (collection.docs)
    collection.docs.forEach((snapshot: any) => {
      const doc = snapshot.data()
      docs.push({ ...doc, id: snapshot.id })
    })

  return docs
}

function updateWeeklyReviewReminderNotification({ groupId, groupName, groupCreated }) {
  Reminder.scheduleWeeklyReviewReminder({ groupId, groupName, groupCreated })
}

function* watchMeUpdate() {
  while (true) {
    const oldMe: RootState['me'] = yield select(state => state.me)
    yield take(TYPES.ME.UPDATE)
    const newMe: RootState['me'] = yield select(state => state.me)

    if (newMe.highestScoreGroup?.groupId && oldMe.highestScoreGroup?.groupId !== newMe.highestScoreGroup.groupId) {
      const { groupId, groupName, groupCreated } = newMe.highestScoreGroup
      yield call(updateWeeklyReviewReminderNotification, {
        groupId,
        groupName,
        groupCreated: groupCreated.seconds * 1000,
      })
    }
  }
}

/**
 * Sync my profile
 * Start sync profile with firebase Firestore. Sync profile operation is
 * cancelled when logout operation is requested
 */
const COL = Firestore.Collections
function* syncDocuments() {
  const user = auth().currentUser
  if (!user) return toast.error(I18n.t('error.Login error'))

  // Sync user profile
  const syncUserTask = yield fork(rsf.firestore.syncDocument, `${COL.USERS}/${user.uid}`, {
    successActionCreator: snap => {
      return { type: TYPES.ME.UPDATE, payload: snap.data() }
    },
  })

  const watchMeUpdateTask = yield fork(watchMeUpdate)

  // Sync translations
  const syncTranslations = yield fork(rsf.firestore.syncCollection, COL.TRANSLATIONS, {
    successActionCreator: snap => ({ type: TYPES.TRANSLATIONS.SYNC, payload: snap }),
    transform: transformCollectionToArray,
  })

  // Sync user groups
  const syncUserGroups = yield fork(
    rsf.firestore.syncDocument,
    firestore().collection(COL.GROUPS).where('members', 'array-contains', user.uid),
    {
      successActionCreator: snap => ({ type: TYPES.GROUPS.SYNC, payload: snap }),
      transform: collection => {
        const ids: Array<any> = []
        const groups: { [key: string]: any } = {}
        if (collection.docs) {
          collection.docs.forEach((snapshot: any) => {
            ids.push(snapshot.id)
            const data = snapshot.data()
            groups[snapshot.id] = {
              id: data.id,
              name: data.name,
            }
          })
        }
        return { groups, ids }
      },
    },
  )

  // Wait for the logout action, then stop sync
  yield take(TYPES.ME.LOGOUT)
  yield cancel(syncUserTask)
  yield cancel(watchMeUpdateTask)
  yield cancel(syncTranslations)
  yield cancel(syncUserGroups)
}

function* syncCampuses() {
  const me: RootState['me'] = yield select(state => state.me)
  if (!me.organisation?.id) {
    return
  }

  const syncCampusTask = yield fork(rsf.firestore.syncCollection, `${COL.ORGANISATIONS}/${me.organisation.id}/${COL.CAMPUSES}`, {
    successActionCreator: snap => {
      return { type: TYPES.CAMPUS.SYNC, payload: { campuses: snap } }
    },
    transform: collection => {
      const campuses = transformCollectionToArray(collection) as App.Campus[]
      if (['admin', 'owner'].includes(me.organisation?.role ?? '')) {
        return campuses
      }
      if (me.organisation?.campusIds && me.organisation.campusIds.length > 0) {
        const accessedCampusIds = me.organisation.campusIds
        return campuses.filter(campus => accessedCampusIds.includes(campus.id))
      }
      return []
    },
  })

  yield take(TYPES.ME.UPDATE)
  yield cancel(syncCampusTask)
}

function* logout() {
  // Notification.shared.unsubscribeTopic()

  try {
    devLog('[LOG OUT]')
    // yield call(Firebase.auth.logout)
    global.Analytics.reset()
    AsyncStorage.clear()
  } catch (e) {
    devWarn('LOG OUT ERROR', e)
  }

  yield put({ type: TYPES.ME.LOGOUT_SUCCESS })
}

export default [takeLatest(TYPES.SYNC, syncDocuments), takeLatest(TYPES.ME.UPDATE, syncCampuses), takeLatest(TYPES.ME.LOGOUT, logout)]
