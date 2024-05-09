import Firestore from '@shared/Firestore'
import { getDateFromFirestoreTime as firestoreDate } from '@shared/Utils'
import { isAfter, isToday } from 'date-fns'
import { useSelector } from 'react-redux'

type useStreakType = { isStreakAdded: () => boolean; checkResetStreak: () => void }

function useStreak(): useStreakType {
  const me = useSelector<any, App.User>(s => s.me)

  function isStreakAdded() {
    if (isToday(firestoreDate(me.lastStreakDate))) {
      return true
    }
    return false
  }

  async function checkResetStreak() {
    devLog('CHECK STREAK', me)
    if (me && me.lastStreakDate && me.nextStreakExpireDate) {
      const now = new Date()
      if (me.currentStreak !== 0 && isAfter(now, firestoreDate(me.nextStreakExpireDate))) {
        Firestore.Auth.updateUser({ currentStreak: 0 })
      }
    }
  }
  return { isStreakAdded, checkResetStreak }
}

export default useStreak
