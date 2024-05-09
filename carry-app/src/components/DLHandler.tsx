import { useDynamicLinkController } from '@hooks/useDynamicLink'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import { wait } from '@shared/Utils'
import React, { useEffect } from 'react'
import branch from 'react-native-branch'

global.CHECKING_INITIAL_LINK_PROMISE = new Promise(resolve => {
  global.RESOLVE_CHECKING__INITIAL_LINK_PROMISE = resolve
})
global.HANDLING_INITIAL_LINK_PROMISE = new Promise(resolve => {
  global.RESOLVE_HANDLING_INITIAL_LINK_PROMISE = resolve
})
global.INITIAL_DL_HANDLED = false
global.IS_HANDELING = false

const resolveWaitingDL = async (isHavingInitDL: boolean, link?: string) => {
  if (!global.INITIAL_DL_HANDLED) {
    global.INITIAL_DL_HANDLED = true
    global.RESOLVE_CHECKING__INITIAL_LINK_PROMISE({ isHavingInitDL, link })
    if (!isHavingInitDL) {
      // Wait for SplashScreen animation
      await wait(500)
      global.RESOLVE_HANDLING_INITIAL_LINK_PROMISE()
    }
  }
}

const DLHandler: React.FC = () => {
  const { handleDynamicLink } = useDynamicLinkController()

  useEffect(() => {
    /*
    Any link that launched the app is cached by the native layers and returned to the branch.subscribe listener after JavaScript finishes loading.
    By default, the initial link is cached for 5 seconds. This allows you to unsubscribe and resubscribe later without receiving the initial link.
    */

    branch.initSessionTtl = 10000
    const unsubscribe = branch.subscribe(async ({ error, params }) => {
      devLog('[BranchIO] received:', error, params)
      // Android and iOS have different behavior
      if (error) {
        devLog('Error from Branch: ' + error)
        Smartlook.trackCustomEvent(CUSTOM_EVENTS.BRANCH_ERROR, { branch_error: JSON.stringify(error) })
        resolveWaitingDL(false)
        return
      }

      let link = (params?.['~referring_link'] || params?.$desktop_url || '') as string
      if (((params?.$desktop_url as string) || '').includes('login?')) {
        link = params?.$desktop_url as string
      }
      if (!link) {
        resolveWaitingDL(false)
        return
      }
      devLog('[Branch DL Found]', params, link)

      if (!params?.['+clicked_branch_link']) {
        // Indicates initialization success and some other conditions.
        // No link was opened.
        resolveWaitingDL(false)
        return
      }

      const isInitialEvent = !global.INITIAL_DL_HANDLED
      resolveWaitingDL(true, link)

      await handleDynamicLink(link, isInitialEvent, params)
    })

    return () => {
      unsubscribe?.()
    }
  }, [handleDynamicLink])

  return null
}

export default DLHandler
