import InAppNotification from '@components/InAppNotification'
import { RootState } from '@dts/state'
import firebase from '@react-native-firebase/app'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import StreamIO from '@shared/StreamIO'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import { debounce } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import RNPush from 'react-native-push-notification'
import { useDispatch, useSelector } from 'react-redux'
import useAppState from './useAppState'

const useCountUnreadDirectMessage = () => {
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { appStatus } = useAppState()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { groups, ids } = useSelector<RootState, RootState['groups']>(state => state.groups)
  const unsubList = useRef<(() => void)[]>([])
  const unsubClient = useRef<{
    unsubscribe: () => void
  }>()
  const currentAppState = useRef(appStatus)
  const [isReadyToWatch, setReadyToWatch] = useState(false)
  const [totalChannels, setTotalChannels] = useState(0)
  const groupUnread = useRef(0)

  const unread = useRef<{
    [groupId: string]: {
      [channelId: string]: number
    }
  }>({})
  const lastInAppMessage = useRef('unknown-id')
  const delayUpdate = useRef(
    debounce(() => {
      dispatch({
        type: TYPES.GROUP.UPDATE_DIRECT_MESSAGES_UNREAD_COUNT,
        payload: unread.current || {},
      })
    }, 500),
  )

  const delayGroupUpdate = useRef(
    debounce(() => {
      dispatch({
        type: TYPES.GROUP.UPDATE_GROUP_MESSAGES_UNREAD_COUNT,
        payload: groupUnread.current,
      })
    }, 500),
  )

  useEffect(() => {
    currentAppState.current = appStatus
  }, [appStatus])

  useEffect(() => {
    const runInit = async () => {
      const user = firebase.auth().currentUser
      if (!user || !me || !me.uid) {
        return setReadyToWatch(false)
      }
      try {
        const userData = await StreamIO.login(me)
        if (!userData) throw 'Missing user data'
        setTotalChannels(userData.me.unread_channels)
        return setReadyToWatch(true)
      } catch (err) {
        return setReadyToWatch(false)
      }
    }
    runInit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.uid, me])

  useEffect(() => {
    if (!isReadyToWatch || !me.uid) {
      unsubClient.current?.unsubscribe?.()
      return
    }

    unsubClient.current = StreamIO.client?.on(async event => {
      if (event.unread_channels) {
        setTotalChannels(event?.unread_channels || 0)
      }
      if (event.type === 'message.new' || event.type === 'notification.message_new') {
        devLog('new event', me.uid, event)
        // Show in-app notification
        if (event?.message?.user?.name && event?.message?.text && lastInAppMessage.current !== event.message.id) {
          lastInAppMessage.current = event.message.id // To stop noti show up twice
          if (global.CURRENT_PRIVATE_CHAT !== event.channel_id) {
            let groupId = event?.channel?.groupId
            let messsageFromGroupChat = false

            if (ids.includes(event.channel_id || '')) {
              groupId = event.channel_id
              messsageFromGroupChat = true
            }

            if (!groupId) {
              try {
                const channel = await StreamIO.channel.get(event.channel_id || '')
                groupId = channel?.data?.groupId
              } catch (err) {
                devLog('Error on get channel', err)
              }
            }
            const title = groupId
              ? I18n.t('text.message from', {
                  nameValue: event.message.user.name,
                  groupValue: groups?.[groupId as string]?.name || '',
                })
              : event.message.user.name

            const channels = await StreamIO.client.queryChannels({ type: 'messaging', id: { $eq: event.channel_id || '' } })
            const muted = channels?.length && channels[0]?.muteStatus?.()?.muted

            if (
              currentAppState.current === 'active' &&
              event?.user?.id !== me.uid && // Not show message send by current user
              !event?.message?.hide_message && // Not show message create for questions of study plan
              !event?.message?.parent_id && // Not show message from discussion
              !(global.CURRENT_SCREEN === Constants.SCENES.GROUP_HOME_TABS.GROUP_CHAT && group.id === groupId) && // Not Show message for Group Chat when it is opening
              !muted //Banner Notification(DM)- is coming inspite of User set as Muted https://github.com/carrybible/carry-issues/issues/579
            ) {
              //global.CURRENT_SCREEN = r
              InAppNotification.show({
                title,
                text: event.message.text,
                onPress: async () => {
                  if (!messsageFromGroupChat) {
                    if (global.CURRENT_PRIVATE_CHAT) {
                      NavigationRoot.pop()
                      await wait(1000) // Wait to clear old channel
                    }
                    NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { id: event.channel_id })
                  } else {
                    // Message from Group Chat
                    if (group.id === groupId) {
                      NavigationRoot.navigate(Constants.SCENES.GROUP_HOME_TABS.GROUP_CHAT)
                    } else {
                      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
                      NavigationRoot.home()
                      setTimeout(() => {
                        toast.success(I18n.t('text.Changed to group', { nameValue: groups[`${groupId}`]?.name ?? '' }))
                        NavigationRoot.navigate(Constants.SCENES.GROUP_HOME_TABS.GROUP_CHAT)
                      }, 250)
                    }
                  }
                },
                btnLabel: I18n.t('text.Reply'),
                id: event.channel_id,
              })
            } else {
              RNPush.localNotification({
                channelId: 'notification.message_new',
                message: event.message.text ?? 'New message',
                title,
                userInfo: {
                  type: 'message_new',
                  id: event.channel_id,
                  disableInApp: true,
                },
                smallIcon: 'ic_notification',
                largeIcon: 'ic_launcher',
              })
            }
          }
        }
        // reCalculateUnread()
      }
    })
    return () => {
      unsubClient.current?.unsubscribe?.()
    }
  }, [isReadyToWatch, groups, me.uid, group.id])

  useEffect(() => {
    const handle = async () => {
      const listMemberExceptMe = group.members?.filter(member => member !== me.uid)
      if (!group.members || !listMemberExceptMe || listMemberExceptMe.length === 0) {
        return
      }

      StreamIO.client
        .queryChannels(
          {
            type: 'messaging',
            members: { $in: [me.uid] },
            member_count: { $eq: 2 },
            id: { $nin: ids },
            groupId: { $eq: group.id },
            $and: [{ members: { $in: group.members.filter(member => member !== me.uid) } }],
          },
          [{ last_message_at: -1 }],
          { watch: true },
        )
        .then(channels => {
          channels.forEach(channel => {
            channel.watch()
            const groupId = channel.data?.groupId as string
            const updateUnreadForChannel = (data?: any) => {
              if (!groupId || !channel.id) return
              if (!unread.current[groupId]) {
                unread.current[groupId] = {}
              }
              unread.current[groupId][channel.id] = channel.countUnread()
              delayUpdate.current()
            }

            updateUnreadForChannel()
            const { unsubscribe: unsubNew } = channel.on('message.new', updateUnreadForChannel)
            const { unsubscribe: unsubRead } = channel.on('message.read', updateUnreadForChannel)
            unsubList.current.push(unsubNew, unsubRead)
          })
        })

      StreamIO.client
        .queryChannels(
          {
            type: 'messaging',
            id: { $eq: group.id },
          },
          [{ last_message_at: -1 }],
          { watch: true },
        )
        .then(channels => {
          channels.forEach(channel => {
            if (channel.id === group.id) {
              channel.watch()
              const updateUnreadForChannel = (data?: any) => {
                groupUnread.current = channel.countUnread()
                delayGroupUpdate.current()
              }

              updateUnreadForChannel()
              const { unsubscribe: unsubNew } = channel.on('message.new', updateUnreadForChannel)
              const { unsubscribe: unsubRead } = channel.on('message.read', updateUnreadForChannel)
              unsubList.current.push(unsubNew, unsubRead)
            }
          })
        })
    }

    // if (unsubList.current.length > 0) {
    //   unsubList.current.forEach(unsub => unsub?.())
    //   unsubList.current = []
    // }

    if (isReadyToWatch) {
      handle()
    }

    return () => {
      unsubList.current.forEach(unsub => unsub?.())
      unsubList.current = []
    }
  }, [group.members, me.uid, isReadyToWatch, totalChannels])
}

export default useCountUnreadDirectMessage
