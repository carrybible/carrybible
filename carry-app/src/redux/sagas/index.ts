import { all } from 'redux-saga/effects'
import syncSagas from './sync'
import group from './group'
import groupActions from './groupActions'
import actionSteps from './actionSteps'
import organisation from './organisation'

/**
 * Root Saga
 */
function* rootSaga() {
  yield all([...syncSagas, ...group, ...groupActions, ...actionSteps, ...organisation])
}

export default rootSaga
