import { RootState } from '@dts/state'
import { CommonActions, StackActions } from '@react-navigation/native'
import { Route } from '@react-navigation/routers'
import Constants from '@shared/Constants'
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useSelector } from 'react-redux'

/**
 * ROOT NAVIGATION
 */
export const navigationRef = React.createRef<any>()
export const queueRef = React.createRef<{
  add: (name: string, params?: any, priority?: number) => void
  next: () => void
  enable: () => void
  disable: () => void
}>()

export const NavigationRoot: {
  getCurrentScreen: () => Route<string>
  addToModalQueue: (name: string, params?: any, priority?: number) => void
  nextModal: () => void
  disableModalQueue: () => void
  enableModalQueue: () => void
  navigate: (name: string, params?: any) => void
  push: (name: string, params?: any) => void
  replace: (name: string, params?: any) => void
  pop: (count?: number) => void
  reset: (props: any) => void
  popToTop: () => void
  home: (params?: { groupId?: string; fromInvitation?: boolean; remindDaily?: boolean }) => void
  groupChat: () => void
  login: () => void
  navigateAcceptInviteGroup: (props: { inviteCode?: string; groupId?: string }) => void
} = {
  getCurrentScreen: function getCurrentScreen(): Route<string> {
    return navigationRef.current?.getCurrentRoute() as Route<string>
  },

  addToModalQueue: function addToQueue(name, params, priority) {
    queueRef.current?.add(name, params, priority)
  },

  nextModal: function nextModal() {
    queueRef.current?.next()
  },

  disableModalQueue: function disableModalQueue() {
    queueRef.current?.disable()
  },

  enableModalQueue: function enableModalQueue() {
    queueRef.current?.enable()
  },

  navigate: function navigate(name, params) {
    navigationRef.current?.navigate(name, params)
  },

  push: function push(name, params) {
    navigationRef.current?.dispatch(StackActions.push(name, params))
  },

  replace: function replace(name, params) {
    const replaceAction = StackActions.replace(name, params)
    navigationRef.current?.dispatch(replaceAction)
  },

  pop: function pop(count) {
    const popAction = StackActions.pop(count)
    navigationRef.current?.dispatch(popAction)
  },

  reset: function reset(props) {
    navigationRef.current?.reset(props)
  },

  popToTop: function popToTop() {
    navigationRef.current?.dispatch(StackActions.popToTop())
  },

  home: function home(params) {
    navigationRef.current?.dispatch(state => {
      if (state.routes[0].name === Constants.SCENES.GROUP_HOME) {
        return CommonActions.navigate({
          name: Constants.SCENES.GROUP_HOME,
          params: {
            screen: 'GroupHomeTab',
            params: {
              screen: Constants.SCENES.GROUP_HOME_TABS.HOME,
              params,
            },
          },
        })
      }
      return CommonActions.reset({
        index: 0,
        routes: [
          {
            name: Constants.SCENES.GROUP_HOME,
            state: {
              routes: [
                {
                  name: 'GroupHomeTab',
                  state: {
                    routes: [
                      {
                        name: Constants.SCENES.GROUP_HOME_TABS.HOME,
                        params,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      })
    })
  },

  groupChat: function groupChat() {
    navigationRef.current?.dispatch(state => {
      if (state.routes[0].name === Constants.SCENES.GROUP_HOME) {
        return CommonActions.navigate({
          name: Constants.SCENES.GROUP_HOME,
          params: {
            screen: 'GroupHomeTab',
            params: {
              screen: Constants.SCENES.GROUP_HOME_TABS.GROUP_CHAT,
            },
          },
        })
      }
      return CommonActions.reset({
        index: 0,
        routes: [
          {
            name: Constants.SCENES.GROUP_HOME,
            state: {
              routes: [
                {
                  name: 'GroupHomeTab',
                  state: {
                    routes: [
                      {
                        name: Constants.SCENES.GROUP_HOME_TABS.GROUP_CHAT,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      })
    })
  },

  login: function login() {
    navigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: Constants.SCENES.ONBOARDING.START_SCREEN }],
      }),
    )
  },

  navigateAcceptInviteGroup: function navigateInviteGroup({ inviteCode, groupId }) {
    navigationRef.current?.dispatch(state => {
      return CommonActions.reset({
        ...state,
        index: state.index + 2,
        routes: [
          ...state.routes,
          {
            name: Constants.SCENES.ONBOARDING.JOIN_A_GROUP,
            params: {
              inviteCode,
            },
          },
          {
            name: Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP,
            params: {
              inviteCode,
              groupId,
            },
          },
        ],
      })
    })
  },
}

/**
 * MODAL STACK NAVIGATION
 */

export const ModalHandler = forwardRef((props, ref) => {
  const { currentScreen } = useSelector<RootState, RootState['screen']>(state => state.screen)
  const isEnableQueue = useRef(false)
  const lastShow = useRef('')
  const queue = useRef<
    {
      screen: string
      params?: any
      priority?: number
    }[]
  >([])

  useImperativeHandle(
    ref,
    () => ({
      add: (screen: string, params?: any, priority?: number) => {
        const isInStackIndex = queue.current.findIndex(val => val.screen === screen)
        if (!isInStackIndex) {
          queue.current.push({ screen, params, priority: priority || 0 })
          queue.current = queue.current.sort((a, b) => (b.priority || 0) - (a.priority || 0))
        }
      },
      next: () => {
        if (queue.current.length > 0 && isEnableQueue) {
          NavigationRoot.navigate(queue.current[0].screen, queue.current[0].params)
        }
      },
      enable: () => {
        isEnableQueue.current = true
      },
      disable: () => {
        isEnableQueue.current = false
      },
    }),
    [],
  )

  useEffect(() => {
    // Check to remove when leave screen in queue
    const isLastScreenInStackIndex = queue.current.findIndex(val => val.screen === lastShow.current)
    if (currentScreen !== lastShow.current && isLastScreenInStackIndex > -1) {
      queue.current = queue.current.filter(val => val.screen === lastShow.current)
      devLog('[NAVIGATION] Remove screen in Queue:', lastShow.current, '| Total left:', queue.current.length)
    }

    // Check if current screen is in queue or not. If not and feature enable, navigate to screen in queue if it exist
    const isCurrentScreenInStackIndex = queue.current.findIndex(val => val.screen === currentScreen)
    if (isCurrentScreenInStackIndex < 0 && queue.current.length > 0 && isEnableQueue.current) {
      devLog('[NAVIGATION] Navigate by Queue:', queue.current[0].screen)
      NavigationRoot.navigate(queue.current[0].screen, queue.current[0].params)
    }

    // Update last screen
    lastShow.current = currentScreen || ''
    if (queue.current.length === 0) isEnableQueue.current = false
  }, [currentScreen])
  return null
})
