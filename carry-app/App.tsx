// Uncomment this to enable debugging on local emulator
// import firestore from '@react-native-firebase/firestore'
// import functions from '@react-native-firebase/functions'
// firestore().useEmulator('localhost', 8080)
// functions().useFunctionsEmulator('http://localhost:5001')

if (__DEV__) {
  import('./ReactotronConfig').then(() => devLog('Reactotron Configured'))
}

import InAppNotification from '@components/InAppNotification'
import InputDialog from '@components/InputDialog'
import NotiHandler from '@components/NotiHandler'
import Toast from '@components/Toast'
import { RootState } from '@dts/state'
import useCountUnreadDirectMessage from '@hooks/useCountUnreadDirectMessage'
import useLoading from '@hooks/useLoading'
import useScreenChanged from '@hooks/useScreenChanged'
import auth from '@react-native-firebase/auth'
import remoteConfig from '@react-native-firebase/remote-config'
import { TYPES } from '@redux/actions'
import redux from '@redux/store'
import ForbiddenZoneEntry from '@scenes/ForbiddenZone/ForbiddenZoneEntry'
import Navigation from '@scenes/navigation'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import DailyReminder from '@shared/DailyReminder'
import { Config, Database, Firestore, Theme } from '@shared/index'
import Smartlook, { SMARTLOOK_API_KEY } from '@shared/Smartlook'
import I18n from 'i18n-js'
import React, { useEffect, useRef } from 'react'
import { DevSettings, LogBox, Platform, StatusBar, StyleSheet, Text } from 'react-native'
import CodePush from 'react-native-code-push'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'

// Ignore some user change the text too big by the system
Text.defaultProps = Text.defaultProps || {}
// Text.defaultProps.allowFontScaling = false

Smartlook.setupAndStartRecording(SMARTLOOK_API_KEY)
enableScreens()

// TODO: Fix Warning, just hide for dev
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'useNativeDriver',
  'RNFileSystem',
  'componentWillReceiveProps',
  'EventEmitter.removeListener',
  'Require cycle',
  'Consecutive calls to',
  '`new NativeEventEmitter()`',
])

toast = {
  success: Toast.success,
  error: Toast.error,
  info: Toast.info,
}

const getActiveRouteName = state => {
  const route = state.routes[state.index]
  if (route.state) {
    return getActiveRouteName(route.state)
  }
  return route.name
}

const App = () => {
  const routeNameRef = useRef('')

  useEffect(() => {
    global.firstTime = false
    remoteConfig()
      .fetchAndActivate()
      .then(fetchedRemotely => {
        if (fetchedRemotely) {
          devLog('Configs were retrieved from the backend and activated.')
        } else {
          devLog('No configs were fetched from the backend, and the local configs were already activated')
        }
      })
  }, [])

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle Forbidden Zone', () => {
      NavigationRoot.navigate(Constants.SCENES.FORBIDDEN_ZONE.HOME)
    })
  }

  return (
    <GestureHandlerRootView style={s.flex}>
      <SafeAreaProvider>
        <Theme.ThemeProvider>
          <StatusBar barStyle="dark-content" translucent />
          <Provider store={redux.store}>
            <PersistGate loading={null} persistor={redux.persistor}>
              <Navigation
                onStateChange={state => {
                  const r = getActiveRouteName(state)
                  if (routeNameRef.current !== r) {
                    global.Analytics.screen(r)
                  }
                  redux.store.dispatch({ type: TYPES.SCREEN.CHANGE_SCREEN, payload: r })
                  global.CURRENT_SCREEN = r
                  routeNameRef.current = r
                }}
              />
              <TrackingView />
              <WatchStateView />
              <NotiHandler shouldHandleInitialNotification shouldHandleNotification />
            </PersistGate>
            {global.IS_INTERNAL && <ForbiddenZoneEntry />}
          </Provider>
          <InAppNotification />
          <Toast />
        </Theme.ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const TrackingView = () => {
  useScreenChanged()
  return null
}

const WatchStateView = () => {
  const dispatch = useDispatch()
  const state = useSelector<RootState, RootState>(state => state)
  const Analytics = useAnalytic()
  const { showLoading, hideLoading } = useLoading()
  const loginEmailRef = useRef<any>()
  const loginLink = useRef<string>('')

  const reEnterAddress = (link: string) => {
    loginLink.current = link
    loginEmailRef?.current?.open()
  }

  global.reEnterAddress = reEnterAddress

  useEffect(() => {
    Database.dispatch = dispatch
    Database.me = state.me
    Database.reading = state.reading
    Database.showLoading = showLoading
    Database.hideLoading = hideLoading
  }, [])

  // eslint-disable-next-line no-unused-vars
  useCountUnreadDirectMessage()

  useEffect(() => {
    // TO-DO: Need to improve
    // Quick solution for access from function
    global.Analytics = Analytics
  }, [Analytics])

  useEffect(() => {
    if (state.me.uid && state.me.streamToken) {
      const fetchData = async () => {
        const settings = await Firestore.Settings.getSettings()
        // devLog('[SETTINGS]', JSON.stringify(settings))
        dispatch({
          type: TYPES.SETTINGS.UPDATE,
          payload: settings,
        })
      }
      fetchData()
    }
  }, [state.me.uid, state.me.streamToken, dispatch])

  useEffect(() => {
    DailyReminder.updateState({ state })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.me.uid, state.me.streamToken, state.screen, state.group?.id, state.group?.channel])

  return (
    <InputDialog
      ref={loginEmailRef}
      title={I18n.t('text.email-different-device')}
      placeholder={I18n.t(`text.Enter your email address`)}
      onOkPress={async (email: string) => {
        loginEmailRef.current?.close()
        showLoading()
        try {
          if (auth().isSignInWithEmailLink(loginLink.current)) {
            const checkAuth = await auth().signInWithEmailLink(email, loginLink.current)
            devLog('Login by email', email, checkAuth)
            dispatch({ type: TYPES.SYNC })
          }
        } catch (e) {
          toast.error(I18n.t('error.Login error'))
          return
        } finally {
          hideLoading()
        }
      }}
    />
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
})

const codePushKey = Platform.select({
  ios: Config.CODEPUSH.IOS,
  android: Config.CODEPUSH.ANDROID,
})

const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.MANUAL,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
  deploymentKey: codePushKey,
}
const CodePushApp = __DEV__ ? App : CodePush(codePushOptions)(App)
// @ts-ignore
const ExportedApp = __DEV__ ? console.tron.overlay(CodePushApp) : CodePushApp

export default ExportedApp
