import Container from '@components/Container'
import Loading from '@components/Loading'
import { RootState } from '@dts/state'
import useOrg from '@hooks/useOrg'
import useTheme from '@hooks/useTheme'
import firebase from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import useStreak from '@scenes/Study/Achievement/hooks/useStreak'
import { RolesCanCreateGroup } from '@shared/Constants'
import { forceChangeLanguage } from '@shared/I18n'
import { Constants, Database, Firestore, LocalStorage, Notification, StreamIO } from '@shared/index'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import { wait } from '@shared/Utils'
import { differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import qs from 'query-string'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAttachmentPickerContext } from 'stream-chat-react-native'
import { NavigationRoot } from '../root'

type Props = StackScreenProps<{ SplashScreen: { isInvite: boolean } }, 'SplashScreen'>

const SplashScreen: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const { color, changeTheme } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const reading = useSelector<RootState, RootState['reading']>(state => state.reading)
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)
  const translations = useSelector<RootState, RootState['translations']>(s => s.translations)
  const { checkResetStreak } = useStreak()
  const { org } = useOrg()

  // Fix issue bottom picker show up on Pixel device
  const { closePicker } = useAttachmentPickerContext()
  useEffect(() => {
    closePicker()
  }, [closePicker])

  const [state, setState] = useState({ progress: 0, message: '', showProgress: false })
  const route = props.route
  const isCreateNewGroup = onboarding.smartPlan || onboarding.quickStudyPlan || onboarding.advancedPlan

  const isLoggedIn = useMemo(() => me.uid && me.streamToken && auth()?.currentUser?.uid, [me])

  const handleOnboardingCreation = async (): Promise<string | undefined> => {
    // Create group and plan in case login by onboarding
    if (onboarding.groupName && onboarding.organisationId) {
      const newGroup = await Firestore.Group.create({
        image: onboarding.groupAvatar?.url,
        name: onboarding.groupName,
        visibility: 'private',
        organisation: {
          id: onboarding.organisationId,
        },
      })
      if (newGroup.success) {
        const userData = (await Firestore.User.getUser({ uid: me.uid })) as App.User
        const group = newGroup.data
        await Firestore.Auth.updateUser({
          latestJoinedGroup: group?.id,
          ...(userData?.organisation || onboarding.organisationId
            ? {
                organisation: {
                  id: userData?.organisation?.id || onboarding.organisationId,
                  role: userData?.organisation?.role || 'leader',
                },
              }
            : {}),
        })
        await Firestore.Group.updateGroup(
          {
            smartPlanAnswers: onboarding.responses?.reduce((pre, cur) => {
              return { ...pre, [cur.questionID]: cur.answerID }
            }, {}),
          },
          group?.id || '',
        )
        if (onboarding.quickStudyPlan) {
          await Firestore.Study.createQuickStudy(group?.id || '', onboarding.quickStudyPlan)
        } else if (onboarding.smartPlan || onboarding.advancedPlan) {
          const plan = onboarding.smartPlan || onboarding.advancedPlan
          await Firestore.Study.applyStudyPlanToGroup(
            group?.id || '',
            {
              ...(plan as any),
              author: me.uid,
              owner: me.uid,
              targetGroupId: group?.id,
              id: '',
              created: firestore.FieldValue.serverTimestamp(),
              updated: firestore.FieldValue.serverTimestamp(),
            },
            onboarding.startDate || new Date(),
          )
        }
        return newGroup.data?.id
      }
    }
    dispatch({ type: TYPES.ONBOARDING.CLEAR })
  }

  const handleShowLeaderPrompt = useCallback(async () => {
    const showCheckLeaderPrompt = !me.latestLeaderPromptShow || differenceInDays(Date.now(), me.latestLeaderPromptShow) > 1
    if (!showCheckLeaderPrompt) {
      return
    }
    const { showPrompt, tip, video } = await Firestore.User.getLeaderPrompt()
    if (showPrompt) {
      dispatch({
        type: TYPES.ME.UPDATE,
        payload: {
          latestLeaderPromptShow: Date.now(),
        },
      })
      setTimeout(() => {
        NavigationRoot.push(Constants.SCENES.LEADER_PROMPTS, {
          tip,
          video,
        })
      }, 500)
    }
  }, [dispatch, me.latestLeaderPromptShow])

  const waitInitialDL = useCallback(async () => {
    if (!global.INITIAL_DL_HANDLED) {
      const { isHavingInitDL, link } = await global.CHECKING_INITIAL_LINK_PROMISE
      const isInviteLink = !!link && !!qs.parseUrl(link).query.i
      if (isHavingInitDL && isInviteLink) {
        setState(prevState => ({
          ...prevState,
          message: I18n.t('text.Pulling up your group invite'),
        }))
        await global.HANDLING_INITIAL_LINK_PROMISE
        await wait(1000)
        return true
      }
      return false
    }
    return false
  }, [])

  useEffect(
    () => {
      async function setupConfigs() {
        if (isLoggedIn) {
          devLog('[LOGGED FLOW] User', me.uid)
          // Setups - Must be call first if user already login
          Smartlook.setUserIdentifier(me.uid, {
            userId: me.uid,
            name: me.name,
            email: me.email,
          })

          try {
            // Check authentication again
            await StreamIO.login(me)
            const user = firebase.auth().currentUser
            if (!user) {
              throw 'Failed to get user from firebase'
            }
          } catch (e) {
            devLog(e)
            toast.error(I18n.t('error.Authentication error'))
            Smartlook.trackCustomEvent(CUSTOM_EVENTS.LOG_OUT, {
              reason: 'Can not login to StreamIO or load Firebase user',
              // @ts-ignore
              error: typeof e === 'string' ? e : e?.message,
            })
            await Firestore.Auth.logout()
            dispatch({ type: TYPES.ME.LOGOUT })
            NavigationRoot.login()
            await StreamIO.client.disconnect()
            return
          }

          global.USER_DELETED = false

          let groupId: string | undefined

          // Handle onboarding flow after login (join group or create group without login)
          if (isCreateNewGroup) {
            await openTranslation()
            groupId = await handleOnboardingCreation()
          }
          if (onboarding.inviteId && onboarding.groupId) {
            await Firestore.Group.acceptInvitation(onboarding.inviteId)
            groupId = onboarding.groupId
            dispatch({ type: TYPES.ONBOARDING.CLEAR })
          } else if (onboarding.groupId) {
            // Only groupId -> join through org invite group
            await Firestore.User.requestJoinGroup(onboarding.groupId)
            groupId = onboarding.groupId
            dispatch({ type: TYPES.ONBOARDING.CLEAR })
          }

          // Sync again
          dispatch({ type: TYPES.SYNC })
          checkResetStreak()

          // If user already finished onboarding
          if (me.translation) {
            // Request notification permission
            const notificationPermission = await Notification.hasPermission()
            const askedNotification = await LocalStorage.getData(LocalStorage.keys.ASKED_NOTIFICATION)
            if (!askedNotification?.asked && !notificationPermission) {
              await new Promise(resolve => {
                NavigationRoot.push(Constants.SCENES.ONBOARDING.ADD_NOTIFICATION, { onContinue: () => resolve(true) })
              })
            }
            Notification.init()
          }

          // Update theme follow user setting
          if (!me.theme) {
            Firestore.Auth.updateUser({ theme: color.id })
          } else {
            changeTheme(me.theme)
          }

          // Update language follow user setting
          if (!me.language) {
            Firestore.Auth.updateUser({ language: global.languageTag })
          } else if (me.language !== global.languageTag) {
            forceChangeLanguage(me.language)
          }
          await StreamIO.streamI18n.setLanguage(global.languageTag)

          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (!me.timeZone || me.timeZone !== timeZone) {
            Firestore.Auth.updateUser({ timeZone })
          }

          const groups = await Firestore.Group.getUsersGroup()

          // If user doesn't have any group we will navigate them to the JoinAGroup screen
          if (groups.length === 0) {
            if (RolesCanCreateGroup.includes(me.organisation?.role || '') || org?.newGroupPermission === 'member') {
              NavigationRoot.replace(Constants.SCENES.LAUNCH.BIBLE_GROUPS)
            } else {
              NavigationRoot.replace(Constants.SCENES.ONBOARDING.JOIN_A_GROUP)
            }
            return
          }

          const isMissingTranslation =
            !me.translation || (!translations.remote.find(trans => trans.abbr === me.translation?.toLowerCase()) && !me.translationId)
          // Have groupId means accept group invite in onboarding flow
          // (we don't allow creating group in onboarding flow anymore)
          if (isMissingTranslation || !me.name || !me.image || groupId) {
            const { personalInfo, skipOnboardingSlides = false } = global.PERSONAL_INVITE_LINK_INFO || {}
            global.PERSONAL_INVITE_LINK_INFO = null
            NavigationRoot.replace(Constants.SCENES.ONBOARDING.QUESTIONS, {
              groupId: groupId || me.latestJoinedGroup || groups[0].data().id,
              personalInfo,
              skipOnboardingSlides,
            })
            return
          }

          // Check for current translation
          await openTranslation()

          // Get the latest group that users opened before.
          if (!groupId) {
            groupId = me.latestJoinedGroup || groups[0].data().id
          }
          dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
          // Wait for DL finish pulling (after navigate to home, Accept invite screen will open immediately)
          await waitInitialDL()
          NavigationRoot.home({ fromInvitation: route.params?.isInvite })
          await handleShowLeaderPrompt()
        } else {
          devLog('[NEW USER FLOW]')
          const haveDL = await waitInitialDL()
          if (NavigationRoot.getCurrentScreen().name === Constants.SCENES.LAUNCH.SPLASH && !haveDL) {
            // If don't have DL, navigate to Login screen immediately
            // Otherwise, wait for DL handle itself
            NavigationRoot.replace(Constants.SCENES.ONBOARDING.START_SCREEN)
          }
        }
      }

      setupConfigs()
    },
    // Run this effect only once when first mounting to init the config
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoggedIn],
  )

  /**
   * Functions
   */
  // Download default translation if:
  // - The translation folder has not been created
  // - Logged and There is no file matched reading translation or remote trans is different with local trans
  // - Version in remove trans higher than local
  // Otherwise, return current local translation
  const downloadTranslations = useCallback(
    async (forceDownload = false) => {
      const isLogin = !!(me?.uid && me?.streamToken)

      const { document, isMissingTran } = await Firestore.Translation.getAbbr(
        me?.translation?.toLowerCase() || reading.translation?.abbr?.toLowerCase() || 'niv',
      )

      const existedInLocalDir = await Firestore.Translation.exists(document)
      const isDifferentVersion =
        (isLogin && me?.translation?.toLowerCase() !== reading.translation?.abbr?.toLowerCase()) ||
        document.version > (reading.translation?.version || 0)

      if (forceDownload || !existedInLocalDir || (!isMissingTran && isDifferentVersion)) {
        // Try to download and check translation in local folder
        await Firestore.Translation.download(document, percentage => {
          setState({
            progress: Math.round(percentage * 100),
            message: I18n.t('text.Getting bible ready'),
            showProgress: true,
          })
          devLog(`Downloading translation progress: ${percentage}`)
        })
        dispatch({ type: TYPES.TRANSLATIONS.VERSION.UPDATE, payload: document })
      }
      return {
        translationPath: document.carryPath!,
      }
    },
    [me, translations.remote, reading, dispatch],
  )

  const openTranslation = useCallback(
    async (forceDownload = false) => {
      const { translationPath } = await downloadTranslations(forceDownload)
      await Database.open(translationPath)
      devLog('[OPEN DATABASE CONNECTION SUCCESSFULLY]')
    },
    [downloadTranslations],
  )

  return (
    <Container>
      <Loading message={state.message} progress={state.progress} showProgress />
    </Container>
  )
}

export default SplashScreen
