import Button from '@components/Button'
import { Footnote, H2 } from '@components/Typography'
import { RootState } from '@dts/state'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import appleAuth from '@invertase/react-native-apple-authentication'
import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore, Metrics, StreamIO, Styles } from '@shared/index'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

type LoginProvider = 'Google' | 'Facebook' | 'Apple' | 'Email'

type Props = unknown

const BottomLogin = (props: Props, ref) => {
  const dispatch = useDispatch()
  const { showLoading, hideLoading } = useLoading()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const [isSignUp, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const { landscape } = useScreenMode()

  useEffect(() => {
    // Navigate to Splash screen from login screen
    if (me.uid && me.streamToken && auth()?.currentUser?.uid) {
      NavigationRoot.replace(Constants.SCENES.LAUNCH.SPLASH)
    } else {
      Firestore.Auth.logout().finally(() => hideLoading())
      StreamIO.client.disconnect()
    }
  }, [me.uid, me.streamToken, hideLoading])

  useImperativeHandle(
    ref,
    () => ({
      open: openModal,
      close: closeModal,
    }),
    [],
  )

  const openModal = (isSignUp = false) => {
    if (modal.current) {
      setIsSignup(isSignUp)
      modal.current.open()
    }
  }

  const closeModal = () => {
    if (modal.current) {
      modal.current.close()
    }
  }

  function loginButtonStyle() {
    return {
      backgroundColor: color.middle,
      shadowColor: color.shadowColor,
      borderColor: color.middle,
    }
  }

  const handleLoginPress = useCallback(
    async (provider: LoginProvider) => {
      setLoading(true)
      closeModal()
      showLoading()

      let profile: any
      try {
        switch (provider) {
          case 'Google':
            profile = await Firestore.Auth.login.google()
            break
          case 'Facebook':
            profile = await Firestore.Auth.login.facebook()
            break
          default:
            profile = await Firestore.Auth.login.apple()
            break
        }

        if (!profile) {
          toast.error(I18n.t('error.Authentication error'))
          hideLoading()
          if (provider === 'Google') {
            await GoogleSignin.revokeAccess()
          }
        } else {
          global.LOGIN_LOADING = true
          dispatch({ type: TYPES.SYNC })
        }
      } catch (error) {
        toast.error(`${provider} login error`)
        setLoading?.(false)
        hideLoading()
      }
    },
    [dispatch, hideLoading, showLoading],
  )

  return (
    <Modalize
      ref={modal}
      disableScrollIfPossible
      adjustToContentHeight
      withReactModal={Platform.OS === 'ios'}
      // eslint-disable-next-line react-native/no-inline-styles
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
        marginLeft: landscape ? '25%' : 0,
        paddingTop: 20,
        paddingHorizontal: 0,
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}>
      <View style={s.wrapper}>
        <H2 bold style={s.title}>
          {isSignUp ? I18n.t('text.Sign up') : I18n.t('text.Sign in')}
        </H2>
        <Button.Full
          loading={loading}
          icon={require('@assets/icons/ic-google.png')}
          text={
            isSignUp
              ? I18n.t('params.Sign up with', { providerValue: 'Google' })
              : I18n.t('params.Sign in with', { providerValue: 'Google' })
          }
          style={[s.button__login, loginButtonStyle()]}
          textStyle={[s.button__login__text, { color: color.text }]}
          onPress={() => handleLoginPress('Google')}
        />
        <Button.Full
          loading={loading}
          icon={require('@assets/icons/icons8-facebook.png')}
          text={
            isSignUp
              ? I18n.t('params.Sign up with', { providerValue: 'Facebook' })
              : I18n.t('params.Sign in with', { providerValue: 'Facebook' })
          }
          style={[s.button__login, loginButtonStyle()]}
          iconSize={36}
          textStyle={[s.button__login__text, { color: color.text }]}
          onPress={() => handleLoginPress('Facebook')}
        />
        <Button.Full
          loading={loading}
          icon={require('@assets/icons/ic-email.png')}
          text={
            isSignUp ? I18n.t('params.Sign up with', { providerValue: 'Email' }) : I18n.t('params.Sign in with', { providerValue: 'Email' })
          }
          style={[s.button__email, loginButtonStyle()]}
          iconSize={32}
          iconColor={color.text}
          textStyle={[s.button__login__text, { color: color.text }]}
          onPress={async () => {
            closeModal()
            await wait(250)
            NavigationRoot.navigate(Constants.SCENES.AUTH.ENTER_YOUR_EMAIL)
          }}
        />
        {appleAuth.isSupported && (
          <Button.Full
            loading={loading}
            icon={require('@assets/icons/ic-apple.png')}
            iconColor={color.id === 'light' ? '#FFF' : '#000'}
            text={
              isSignUp
                ? I18n.t('params.Sign up with', { providerValue: 'Apple' })
                : I18n.t('params.Sign in with', { providerValue: 'Apple' })
            }
            style={[
              s.button__login,
              loginButtonStyle(),
              // eslint-disable-next-line react-native/no-inline-styles
              {
                backgroundColor: color.id === 'light' ? '#000' : '#FFF',
              },
            ]}
            textStyle={[
              s.button__login__text,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                color: color.id === 'light' ? '#FFF' : '#000',
              },
            ]}
            onPress={() => handleLoginPress('Apple')}
          />
        )}
      </View>
      <Footnote style={s.policy} color="gray2">
        {I18n.t('text.login policy')}
      </Footnote>
    </Modalize>
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: Metrics.screen.width,
  },
  button__login: {
    ...Styles.shadow,
    ...Styles.br7,
    paddingVertical: 5,
    marginBottom: 15,
    borderColor: '#CFCFCF',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    marginHorizontal: 25,
    width: Metrics.screen.width - 40,
    flex: 1,
    height: 50,
  },
  button__email: {
    ...Styles.shadow,
    ...Styles.br7,
    paddingVertical: 5,
    marginBottom: 15,
    borderColor: '#CFCFCF',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    marginHorizontal: 30,
    width: Metrics.screen.width - 40,
    flex: 1,
    height: 50,
  },
  button__login__text: {
    marginLeft: 5,
    fontWeight: '500',
  },
  wrapper: {
    marginVertical: Metrics.insets.vertical,
    alignItems: 'center',
  },
  title: { marginVertical: 20 },
  policy: {
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 30,
  },
})

export default forwardRef(BottomLogin)
