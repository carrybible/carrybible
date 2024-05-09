import app from '@redux/slices/app'
import group from '@redux/slices/group'
import members from '@redux/slices/members'
import home from '@redux/slices/home'
import login from '@redux/slices/login'
import me from '@redux/slices/me'
import plan from '@redux/slices/plan'
import organisation from '@redux/slices/organisation'
import giving from '@redux/slices/giving'
import { combineReducers } from 'redux'

const reducers = combineReducers({
  app,
  me,
  login,
  home,
  group,
  members,
  plan,
  organisation,
  giving,
})

export const rootReducer: typeof reducers = (state, action) => {
  if (action.type === 'store/reset') {
    return reducers(undefined, action)
  }
  return reducers(state, action)
}

export const resetReducer = () => {
  return {
    type: 'store/reset',
  }
}
