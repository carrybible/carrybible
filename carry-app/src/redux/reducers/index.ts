import { combineReducers } from 'redux'
import reading from './reading'
import me from './me'
import invites from './invites'
import translations from './translations'
import groups from './groups'
import group from './group'
import groupActions from './groupActions'
import local from './local'
import screen from './screen'
import onboarding from './onboarding'
import settings from './settings'
import actionSteps from './actionSteps'
import campuses from './campus'
import organisation from './organisation'

const rootReducers = combineReducers({
  // ---- Currently using
  me,
  group,
  reading,
  local, // Still using in StreakScreen but seems useless, everything is relied on Firebase now
  screen,
  groups,
  groupActions,
  onboarding,
  settings, // All setting should be fetch at start app or after login
  invites,
  translations,
  actionSteps,
  campuses,
  organisation,
})

export default rootReducers
