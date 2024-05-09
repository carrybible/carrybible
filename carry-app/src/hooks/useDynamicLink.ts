import { RootState } from '@dts/state'
import AsyncStorage from '@react-native-async-storage/async-storage'
import firebase from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import qs from 'query-string'
import { useCallback, useEffect, useRef } from 'react'
import { BranchParams } from 'react-native-branch'
import { useDispatch, useSelector } from 'react-redux'
import useLoading from './useLoading'

let isProcessingDL = false
const AuthAcceptScreen = [
  'Start',
  'JoinAGroup',
  'HomeTab',
  'GroupStudyPlanTab',
  'GroupChatTab',
  'DirectMessageTab',
  'NewMessage',
  'PrivateChat',
  'Plan',
  'GroupSettings',
  'AccountSettings',
  'BibleGroups',
  'GroupActions.Listing',
  'GroupCreate',
  'Reminder',
  'GroupShare',
  'GroupThread',
  'GroupActions.Detail',
  'GroupActions.Discussions',
  'GroupActions.Create',
  'SetStudyType',
  'Study.PickStudy',
  'Study.PickStudy.Setting',
  'Study.QuickStudy.Book',
  'Study.QuickStudy.Setting',
  'Study.Preview',
  'Study.Activities',
  'CurrentGoalCompleted',
  'StreakAchieved',
  'WeeklyPlanCompleted',
  'StudyPlanCompleted',
  'SmartPlanQuestions',
  'SmartPlanBuilding',
  'SmartPlanConfirm',
  'SmartPlanStartDate',
  'InvitationModal',
  'ShareGroup',
  'Welcome',
  'UnlockFeatures',
]

export type InvitationType = {
  id: string
  groupId?: string
  organisationId?: string
  type?: string
  personalInfo?: { name?: string; phone?: string }
  skipOnboardingSlides?: boolean
}

type PendingInvitationType = {
  inviteCode: string
  groupId?: string
  organisationId?: string
  type?: string
  personalInfo?: { name?: string; phone?: string }
  skipOnboardingSlides?: boolean
}

const useHandleInvitationLink = () => {
  const { showLoading, hideLoading } = useLoading()

  const pendingInvitation = useRef<PendingInvitationType | null>(null)
  const setPendingInvitation = useCallback((newPendingInvitation: PendingInvitationType | null) => {
    pendingInvitation.current = newPendingInvitation
  }, [])

  // Effect to handle pending invitation when screen change
  const { currentScreen } = useSelector<RootState, RootState['screen']>(s => s.screen)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pendingInvitation.current && AuthAcceptScreen.includes(currentScreen || '')) {
        if (pendingInvitation.current?.type !== 'prayer') {
          NavigationRoot.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, pendingInvitation.current)
        }
        setPendingInvitation(null)
      }
    }, 500)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [currentScreen, setPendingInvitation])

  const handleInvitationLink = useCallback(
    async ({ invitationId, isInitial, isLogin }: { invitationId: string; isInitial?: boolean; isLogin?: boolean }) => {
      // Show loading in case user not in Splash Screen to let user know that DL is handling
      if (!isInitial && NavigationRoot.getCurrentScreen().name !== Constants.SCENES.LAUNCH.SPLASH) {
        showLoading()
      }
      try {
        // Use DL data from params
        let invitation
        let isValidURLStr = true
        const invitationSnap = await Firestore.Group.getInvitationIdById(invitationId)
        if (invitationSnap) {
          invitation = invitationSnap?.data() as InvitationType
        } else {
          isValidURLStr = false
        }

        if (!invitation || (!invitation.groupId && !invitation.organisationId)) {
          devLog('[Invite Link Not Found or Error]')
          // Error case on get invitation data
          if (!isValidURLStr && !isLogin) {
            toast.error(I18n.t('text.Something went wrong with invite link'))
          }
          hideLoading()
          if (NavigationRoot.getCurrentScreen().name === Constants.SCENES.LAUNCH.SPLASH) {
            // Prevent case that user is blocked in Splash Screen
            if (isLogin) {
              NavigationRoot.home()
            } else {
              NavigationRoot.replace(Constants.SCENES.ONBOARDING.START_SCREEN)
            }
          }
          return
        }

        devLog('[INVITE LINK RUNNING]', invitation)
        let inviteCode
        const { groupId, organisationId, type, personalInfo, skipOnboardingSlides = true } = invitation

        if (isInitial) {
          global.PERSONAL_INVITE_LINK_INFO = {
            personalInfo,
            skipOnboardingSlides,
          }
        }

        if (type === 'prayer') {
          // We won't support this type of prayer link anymore
          toast.error(I18n.t('text.Invalid invite link'))
          return
        }

        if (groupId) {
          // Gen code for invitation
          const codeData = await Firestore.Group.generateInviteCode(groupId)
          devLog('[DL] codeData: ', codeData)
          if (!codeData.success) {
            toast.error(I18n.t('text.Something went wrong with invite link. Can not found invite code!'))
            return
          }
          inviteCode = codeData.data.code
        }

        const inviteData = {
          inviteCode,
          groupId,
          organisationId,
          personalInfo,
        }

        if (isLogin) {
          // If user already logged in, we'll check the current screen to see if it's suitable
          // to show AcceptInviteGroup screen or not. Otherwise, we will wait for user to go to
          // the right screen and show the AcceptInviteGroup screen instead
          if (AuthAcceptScreen.includes(NavigationRoot.getCurrentScreen().name)) {
            // Normal invitation
            if (isInitial) {
              await wait(500)
            }
            NavigationRoot.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, inviteData)
          } else {
            // Added to pending invitation and wait for user to move to other screen
            setPendingInvitation({
              inviteCode,
              groupId,
              organisationId,
              type,
              personalInfo,
            })
          }
        } else {
          // If not login yet, immediately open Accept invite screen
          if (isInitial) {
            await wait(500)
          }
          if (NavigationRoot.getCurrentScreen().name === Constants.SCENES.LAUNCH.SPLASH) {
            // Only replace in case Splash Screen
            NavigationRoot.replace(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, inviteData)
          } else {
            NavigationRoot.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, inviteData)
          }
        }
      } catch (e) {
        devWarn('handleInvitationLink failed', e)
      } finally {
        hideLoading()
        global?.RESOLVE_HANDLING_INITIAL_LINK_PROMISE?.()
      }
    },
    [hideLoading, setPendingInvitation, showLoading],
  )

  return handleInvitationLink
}

const useHandleOpenPrayerLink = () => {
  const dispatch = useDispatch()
  const { showLoading, hideLoading } = useLoading()

  const handleOpenPrayerLink = useCallback(
    async ({ groupId, isLogin, userId, isInitial }: { groupId: string; isLogin?: boolean; userId?: string; isInitial?: boolean }) => {
      if (!isLogin) {
        return
      }
      if (!isInitial) {
        showLoading()
      } else {
        await wait(4000)
      }
      try {
        const group = await Firestore.Group.getGroup({ groupId })
        const isMember = group?.members?.includes(userId)
        if (!isMember) {
          return
        }
        dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
        NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE, { type: 'prayer' })
      } finally {
        if (!isInitial) {
          hideLoading()
        }
      }
    },
    [dispatch, hideLoading, showLoading],
  )
  return handleOpenPrayerLink
}

const useHandleLoginEmailMagicLink = () => {
  const dispatch = useDispatch()
  const { showLoading, hideLoading } = useLoading()

  const handleLoginEmailMagicLink = useCallback(
    async ({ loginLink }: { loginLink: string; isInitial }) => {
      const user = firebase.auth().currentUser
      if (user) {
        toast.error(I18n.t('error.Already login'))
        return
      }

      console.log('login with email', loginLink)
      showLoading()
      try {
        if (auth().isSignInWithEmailLink(loginLink)) {
          // Use the email we saved earlier
          const email = (await AsyncStorage.getItem('emailForSignIn')) || ''
          if (!email) {
            global.reEnterAddress(loginLink)
            return
          }
          const checkAuth = await auth().signInWithEmailLink(email, loginLink)
          devLog('[Login by email]', email, checkAuth)
          dispatch({ type: TYPES.SYNC })
        }
      } catch (e: any) {
        if (e?.message?.includes('[auth/invalid-email]')) {
          global.reEnterAddress(loginLink)
        } else {
          devLog('[LOGIN EMAIL ERROR]', e?.message)
          toast.error(I18n.t('error.Login error'))
        }
      } finally {
        hideLoading()
      }
    },
    [dispatch, hideLoading, showLoading],
  )
  return handleLoginEmailMagicLink
}

const getQuery = urlStr => {
  let query: any
  try {
    query = qs.parseUrl(urlStr).query
    return query
  } catch (e) {
    toast.error(I18n.t('error.not-valid-link'))
    query = undefined
  }
}

const getUrl = url => {
  try {
    const urlObject = new URL(url || '')
    return urlObject
  } catch (e) {
    return undefined
  }
}

export const useDynamicLinkController = () => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)

  const handleInvitationLink = useHandleInvitationLink()
  const handleOpenPrayerLink = useHandleOpenPrayerLink()
  const handleLoginEmailMagicLink = useHandleLoginEmailMagicLink()

  const handleDynamicLink = useCallback(
    async (urlStr: string, isInitial?: boolean, params?: BranchParams) => {
      devLog('[Start handling DL]', urlStr, isInitial)
      Smartlook.trackCustomEvent(CUSTOM_EVENTS.HANDLE_DYNAMIC_LINK, { url: urlStr, isInitial: `${isInitial}` })
      const isLogin = !!(me.uid && me.streamToken && auth()?.currentUser?.uid)

      const desktopUrl = getUrl(params?.$desktop_url)
      const referringURL = getUrl(params?.['~referring_link'])

      const desktopQuery = getQuery(params?.$desktop_url)
      const referringQuery = getQuery(params?.['~referring_link'])

      const checkURL = (pathCheck: string, paramCheck: string) => {
        if (desktopUrl?.pathname === pathCheck && desktopQuery?.[paramCheck]) {
          return {
            url: desktopUrl,
            query: desktopQuery,
          }
        }
        if (referringURL?.pathname === pathCheck && referringQuery?.[paramCheck]) {
          return {
            url: referringURL,
            query: referringQuery,
          }
        }
        return undefined
      }

      // Email login link
      // Ex: https://carrybible.com/login?link=https://carry-dev.firebaseapp.com/__/auth/action?apiKey=xxx&mode=signIn&oobCode=xxx-xxx&lang=en
      const checkLogin = checkURL('/login', 'link')
      if (checkLogin) {
        await handleLoginEmailMagicLink({
          loginLink: decodeURIComponent(checkLogin.query?.link as string),
          isInitial,
        })
        return
      }

      // Invitation link
      // Ex: https://www.carrybible.com/join?i=tPp46UaSvK5545ZgoLHS
      const checkJoin = checkURL('/join', 'i')
      if (checkJoin) {
        await handleInvitationLink({ invitationId: checkJoin.query.i as string, isInitial, isLogin })
        return
      }

      // Create prayer link
      // Ex: https://www.carrybible.com/prayer?groupId=OHcR5pGoS75BQ3UhP9rk
      const checkPrayer = checkURL('/prayer', 'groupId')
      if (checkPrayer) {
        await handleOpenPrayerLink({
          groupId: checkPrayer.query.groupId as string,
          isLogin,
          isInitial,
          userId: me?.uid,
        })
        return
      }

      await handleInvitationLink({
        invitationId: (params?.['~referring_link'] || params?.$desktop_url || '') as string,
        isInitial,
        isLogin,
      })
    },
    [handleInvitationLink, handleLoginEmailMagicLink, handleOpenPrayerLink, me.streamToken, me.uid],
  )

  return {
    handleDynamicLink: async (urlStr: string, isInitial?: boolean, params?: BranchParams) => {
      devLog('handle Dyn link', urlStr, isInitial, isProcessingDL, params)
      try {
        if (isProcessingDL) {
          return
        }
        isProcessingDL = true
        await handleDynamicLink(urlStr, isInitial, params)
        return
      } finally {
        isProcessingDL = false
      }
    },
  }
}
