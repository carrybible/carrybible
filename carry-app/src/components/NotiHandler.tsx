import { RootState } from '@dts/state'
import firebase from '@react-native-firebase/app'
import messaging from '@react-native-firebase/messaging'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Config, Constants, Emitter, Firestore, Notification, Reminder, StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import RNPush from 'react-native-push-notification'
import { useDispatch, useSelector } from 'react-redux'
import InAppNotification from './InAppNotification'

interface Props {
  shouldHandleInitialNotification?: boolean
  shouldHandleNotification?: boolean
}

export const EVENTS = {
  SERVER: {
    info: 'INFO_ONLY',
    remind_daily_flow: 'REMIND_DAILY_FLOW',
    remind_pray: 'REMIND_PRAY',
    complete_goal: 'COMPLETE_GOAL',
    joined_group: 'JOINED_GROUP',
    left_group: 'LEFT_GROUP',
    group_action_created: 'GROUP_ACTION_CREATED',
  },
}

const NotiHandler: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const me = useSelector<any, App.User>(s => s.me)
  const { currentScreen } = useSelector<RootState, RootState['screen']>(state => state.screen)
  const Analytics = useAnalytic()
  const isInitDone = useRef(false)
  const [meetHomeTab, setMeetHomeTab] = useState(false)

  useEffect(() => {
    if (currentScreen === 'HomeTab' && !meetHomeTab) {
      setMeetHomeTab(true)
    }
  }, [meetHomeTab, currentScreen])

  const handleNotification = (isInitialEvent, noti: any, handler?: () => void, actionLabel?: string, id?: string) => {
    devLog('[NOTIFICATION PROCESSING]', 'Is Initial', noti, isInitialEvent)
    if (
      isInitialEvent ||
      noti.data?.disableInApp ||
      (!noti.category &&
        (noti.category === 'STREAM_IO' ||
          noti.data?.category === 'STREAM_IO' ||
          noti.data?.sender === 'stream.chat' ||
          noti.data?.type === 'message_new'))
    ) {
      return handler?.()
    }
    InAppNotification.show({ title: noti.title || Config.APP_NAME, text: noti?.message, onPress: handler, btnLabel: actionLabel, id })
    isInitDone.current = true
  }

  async function handleNotificationMessage(noti: any, isInitialEvent = false) {
    devLog('[NOTIFICATION HANDLER]', JSON.stringify(noti))
    // Only noti when user logged
    const user = firebase.auth().currentUser
    if (!user || !me || !me.uid) {
      return
    }

    if (noti.data) {
      Analytics.event(Constants.EVENTS.NOTIFICATION.TAP)
      if (!StreamIO.client.user) await StreamIO.login(me)

      // MESSAGE FROM STREAM_IO
      if (
        noti.category === 'STREAM_IO' ||
        noti.data?.category === 'STREAM_IO' ||
        noti.data?.sender === 'stream.chat' || // Stream Push payload v2
        noti.data?.type === 'message_new'
      ) {
        return handleNotification(isInitialEvent, noti, async () => {
          const channel = noti.data?.channel ?? noti.data?.channel_id
          if (noti.data?.id?.includes('private')) {
            Analytics.event(Constants.EVENTS.NOTIFICATION.DM)
            NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { id: noti.data?.id })
          }
          // Open Direct Message
          else if (channel?.includes('private')) {
            Analytics.event(Constants.EVENTS.NOTIFICATION.DM)
            try {
              const channels = await StreamIO.client.queryChannels({ type: 'messaging', id: channel })
              // Note: sometimes channels can't query so it can't navigate after pressing on notification

              if (channels.length > 0 && channels[0].data?.groupId) {
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: channels[0].data.groupId })
                NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { id: channel })
              }
            } catch (error) {
              NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { id: channel })
            }
          }
          // Open thread discussion
          else if (noti.data?.parentId) {
            Analytics.event(Constants.EVENTS.NOTIFICATION.THREAD)
            NavigationRoot.navigate(Constants.SCENES.GROUP.DISCUSS_THREAD, {
              threadId: noti.data?.parentId,
              groupId: noti.data?.channel,
              forceRemote: isInitialEvent,
            })
          }
          // Open Group Chat
          else {
            Analytics.event(Constants.EVENTS.NOTIFICATION.GENERAL)
            dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: channel })
            NavigationRoot.groupChat()
          }
          isInitDone.current = true
        })
      }

      // EVENT SEND FROM SERVER
      if (noti.data.event) {
        switch (noti.data.event) {
          case EVENTS.SERVER.complete_goal:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                Analytics.event(Constants.EVENTS.NOTIFICATION.COMPLETE_GOAL)
                if (noti.data && noti.data.planId) {
                  dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                  NavigationRoot.home()
                  NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.PREVIEW, {
                    planId: noti.data.planId,
                    groupId: noti.data.groupId,
                  })
                }
              },
              I18n.t('text.Open study plan'),
            )
          case EVENTS.SERVER.joined_group:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                Analytics.event(Constants.EVENTS.NOTIFICATION.JOINED_GROUP)
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                NavigationRoot.home()
              },
              I18n.t('text.Open group'),
            )
          case EVENTS.SERVER.group_action_created:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                Analytics.event(Constants.EVENTS.NOTIFICATION.NEW_ACTIONS)
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.DETAIL, {
                  mode: 'unread',
                  initGroupActionId: noti.data.actionId,
                  groupId: noti.data.groupId,
                })
              },
              I18n.t('text.View'),
            )
          case EVENTS.SERVER.left_group:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                Analytics.event(Constants.EVENTS.NOTIFICATION.LEFT_GROUP)
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                NavigationRoot.home()
              },
              I18n.t('text.Open group'),
            )
          case EVENTS.SERVER.info:
            return handleNotification(isInitialEvent, noti)
          case EVENTS.SERVER.remind_daily_flow:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                NavigationRoot.home({ remindDaily: true })
              },
              I18n.t('text.Open group'),
            )
          case EVENTS.SERVER.remind_pray:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                NavigationRoot.home()
                NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE, { type: 'prayer' })
              },
              I18n.t('text.Create'),
            )
          default:
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                if (noti.data.groupId) {
                  dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: noti.data.groupId })
                  NavigationRoot.home()
                }
              },
              I18n.t('text.Open group'),
            )
        }
      }

      // TYPE CREATE BY LOCAL
      if (noti.data.type) {
        Reminder._onNotification(noti)
        switch (noti.data.type) {
          case 'reminder':
            global.Analytics.event(Constants.EVENTS.NOTIFICATION.GOAL_REMINDER)
            return handleNotification(isInitialEvent, noti)
          case 'weekly_review': {
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                const { groupId } = noti.data
                dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
                if (NavigationRoot.getCurrentScreen().name !== Constants.SCENES.GROUP_HOME_TABS.HOME) {
                  NavigationRoot.home()
                }
                setTimeout(async () => {
                  try {
                    const weeklyReviewData = await Firestore.Group.getWeeklyReview(groupId)
                    NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.WEEKLY_REVIEW, {
                      weeklyReviewData,
                    })
                    // @ts-ignore
                  } catch (e: Error) {
                    toast.error(e.message)
                  }
                }, 500)
              },
              I18n.t('text.Open study plan'),
            )
          }
          case 'future-plans':
            return handleNotification(
              isInitialEvent,
              noti,
              () => {
                NavigationRoot.push(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
                  groupId: noti.data.groupId,
                  isFromGroup: true,
                  isHaveActive: false,
                })
              },
              I18n.t('text.Open study plan'),
            )
        }
      }

      isInitDone.current = true
    }
  }

  useEffect(() => {
    // Only start handle nofication when open HomeTab
    if (meetHomeTab) {
      Reminder.initialNotification(handleNotificationMessage)
      RNPush.popInitialNotification(notification => {
        if (!notification || !isInitDone.current) return
        handleNotificationMessage(notification)
      })

      const unsubscribe = messaging().onMessage(async remoteMessage => {
        devLog('get remoteMessage', remoteMessage)
      })

      const id = Emitter.on('onNotificationOpened', (noti: any) => {
        if (props.shouldHandleNotification) {
          devLog('[NOTIFICATION ON OPENED]', noti)
          // set initial = true to prevent show in app notification when pressing notification from the system
          handleNotificationMessage(noti, true)
        }
      })

      if (props.shouldHandleInitialNotification) {
        Notification.getInitialNotification().then(noti => {
          if (noti) {
            devLog('[NOTIFICATION ON INITIAL]', noti)
            handleNotificationMessage(noti, true)
          } else {
            devLog('[NOTIFICATION ON INITIAL]', 'NOT FOUND NOTI')
            isInitDone.current = true
          }
        })
      }

      return () => {
        Emitter.rm(id)
        unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetHomeTab])

  return null
}

NotiHandler.defaultProps = {
  shouldHandleNotification: true,
  shouldHandleInitialNotification: true,
}

export default React.memo(NotiHandler, () => true)
