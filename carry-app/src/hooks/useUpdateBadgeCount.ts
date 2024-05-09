import GroupActions from '@dts/groupAction'
import { RootState } from '@dts/state'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import collections from '@shared/Firestore/collections'
import Notification from '@shared/Notification'
import StreamIO from '@shared/StreamIO'
import { sub } from 'date-fns'
import { debounce } from 'lodash'
import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useSelector } from 'react-redux'

const getGroupActionCount = async (userId: string, groupId: string): Promise<number> => {
  const beginningOfToday = new Date(new Date().setHours(0, 0, 0, 0))
  const checkDate = firestore.Timestamp.fromDate(sub(beginningOfToday, { days: 7 }))
  let isHavingUnreadPrayer = false
  let isHavingUnreadGratitude = false
  const snap = await firestore()
    .collection(collections.GROUPS)
    .doc(groupId)
    .collection(collections.ACTIONS)
    .where('created', '>', checkDate)
    .limit(100)
    .get()

  snap.forEach(doc => {
    const data = doc.data() as GroupActions
    if (!data.viewerIds.includes(userId)) {
      if (data.type === 'prayer') {
        isHavingUnreadPrayer = true
      } else {
        isHavingUnreadGratitude = true
      }
    }
  })

  if (isHavingUnreadGratitude && isHavingUnreadPrayer) {
    return 2
  } else if (isHavingUnreadGratitude || isHavingUnreadPrayer) {
    return 1
  }
  return 0
}

const getUnreadPrivateMessageCount = async (userId: string, groupId: string): Promise<number> => {
  const groupInfoSnap = await firestore().collection(collections.GROUPS).doc(groupId).get()
  const groupInfo = groupInfoSnap.data() as App.Group
  let listMemberExceptMe = groupInfo.members?.filter(member => member !== userId)
  if (!listMemberExceptMe || listMemberExceptMe.length === 0) {
    listMemberExceptMe = ['random_id'] // HACK: StreamIO will throw error if we pass empty array
  }
  const channels = await StreamIO.client.queryChannels({
    type: 'messaging',
    members: { $in: [userId] },
    member_count: { $eq: 2 },
    groupId: { $eq: groupId },
    $and: [{ members: { $in: listMemberExceptMe } }],
  })
  let count = 0
  channels.forEach(channel => {
    if (channel.countUnread() > 0) {
      count++
    }
  })

  return count
}

const getBadgeCount = async (rawGroupId?: string): Promise<number> => {
  devLog('Start getBadgeCount')
  const userId = auth().currentUser?.uid
  if (!userId) {
    return 0
  }
  let groupId = rawGroupId
  if (!groupId) {
    // get default group from firebase
    const userInfoSnapshot = await firestore().collection(collections.USERS).doc(userId).get()
    const userInfo = userInfoSnapshot.data() as App.User
    groupId = userInfo.latestJoinedGroup
  }
  if (!groupId) {
    // if there are still no group id then we can clear the badge
    return 0
  }

  const totalCount = (await Promise.all([getGroupActionCount(userId, groupId), getUnreadPrivateMessageCount(userId, groupId)])).reduce(
    (total, count) => total + count,
    0,
  )
  devLog(`End getBadgeCount: ${totalCount}`)
  return totalCount
}

const useUpdateBadgeCount = () => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const updateBadgeCount = useCallback(
    debounce(async () => {
      const count = await getBadgeCount(group.id)
      Notification.setBadgeCount(count)
    }, 500),
    [group.id],
  )

  useEffect(() => {
    updateBadgeCount()
  }, [updateBadgeCount])

  const appState = useRef(AppState.currentState)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // Update badge count when app state change fromm active to background
        updateBadgeCount()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription?.remove()
    }
  }, [updateBadgeCount])

  return null
}

export default useUpdateBadgeCount
