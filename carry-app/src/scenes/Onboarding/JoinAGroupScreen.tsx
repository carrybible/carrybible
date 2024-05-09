import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import SettingItem from '@components/SettingItem'
import TextField from '@components/TextField'
import { H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { useDynamicLinkController } from '@hooks/useDynamicLink'
import useJoinGroup from '@hooks/useJoinGroup'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useLoading from '@hooks/useLoading'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import { formatCodeInput } from '@shared/Utils'
import cc from 'color'
import I18n from 'i18n-js'
import * as React from 'react'
import { useState } from 'react'
import { Animated, Image, Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import DoNotHaveCodeModal, { DoNotHaveCodeModalModalize } from '../Common/components/DoNotHaveCodeModal'

type ParamProps = {
  inviteCode?: string
}

type Props = StackScreenProps<{ JoinAGroupScreen: ParamProps }, 'JoinAGroupScreen'>

const JoinAGroupScreen: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { showLoading, hideLoading } = useLoading()
  const keyboardPadding = useKeyboardPadding({ androidEnable: true, extraPadding: -Metrics.screen.height * 0.15 })
  const [code, setCode] = useState(formatCodeInput(props.route.params?.inviteCode ?? ''))
  const modalRef = React.useRef<DoNotHaveCodeModalModalize>(null)
  const { handleJoinGroup } = useJoinGroup()
  const { handleDynamicLink } = useDynamicLinkController()
  const { landscape } = useScreenMode()
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)

  const isFirstScreen = props.navigation.getState().index === 0

  const onChangeCode = (id: string, newCode: string) => {
    setCode(formatCodeInput(newCode))
  }

  const onPressScanQR = () => {
    NavigationRoot.navigate(Constants.SCENES.SCAN_QR_CODE, { onSuccess: onQRCode })
  }

  const onQRCode = async (newCode = '') => {
    if (!newCode) {
      toast.error(I18n.t('text.Not found QR Code'))
      return
    }
    toast.success(I18n.t('text.Processing QR code'))
    if (newCode.length < 10) {
      setCode(newCode)
      handleJoinGroup(newCode)
      return
    }
    await handleDynamicLink(newCode)
  }

  const onOpenModal = () => {
    modalRef.current?.open?.()
  }

  const ContentContainer = React.useMemo(() => {
    if (landscape) return ScreenView
    return View
  }, [landscape])

  return (
    <Container safe style={s.container}>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.gray2}
        iconLeftSize={22}
        onPressLeft={
          ids?.length > 0 || !me.uid
            ? !isFirstScreen
              ? () => {
                  NavigationRoot.pop()
                }
              : () => {
                  NavigationRoot.navigate(Constants.SCENES.ACCOUNT_SETTINGS)
                }
            : undefined
        }
        RightComponent={
          ids?.length > 0 || !me.uid ? undefined : (
            <SettingItem
              icon="log-out"
              text={I18n.t('text.Log out')}
              onPress={async () => {
                try {
                  showLoading()
                  await Firestore.Auth.logout()
                } catch (err) {
                  devLog('error logout', err)
                }

                hideLoading()
                dispatch({ type: TYPES.ME.LOGOUT })
                NavigationRoot.login()
              }}
              containerStyle={s.logoutContainer}
              textStyle={s.logoutText}
            />
          )
        }
      />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <Animated.View style={[s.contentWrapper, { transform: [{ translateY: keyboardPadding }] }]}>
          <ContentContainer>
            <View style={s.alignCenter}>
              <H1 style={s.title}>{I18n.t('text.Join a group')}</H1>
              <Text style={s.desc} color="gray">
                {I18n.t('text.Enter 6 digits code')}
              </Text>
              <Image source={require('@assets/images/join-a-group.png')} style={s.image} resizeMode="contain" />
            </View>

            <TextField
              // @ts-ignore
              autoCapitalize="characters"
              containerStyle={s.textField}
              style={[
                s.textFieldText,
                !code && {
                  backgroundColor: cc(color.background).mix(cc(color.gray6), 0.4).hex(),
                  borderColor: cc(color.middle).mix(cc(color.gray4), 0.4).hex(),
                },
              ]}
              label={I18n.t('Enter code')}
              placeholderWeight="500"
              onChangeText={onChangeCode}
              value={code}
              numberOfLines={1}
              maxLength={11}
            />
            <View style={s.joinGroupBtnContainer}>
              <BottomButton
                style={s.joinGroupBtnContainer}
                title={I18n.t('text.Join with code')}
                onPress={() => {
                  Keyboard.dismiss()
                  handleJoinGroup(code)
                }}
                rounded
              />
              <BottomButton
                secondary
                style={s.joinGroupBtnContainer}
                title={I18n.t('text.Scan QR code')}
                onPress={onPressScanQR}
                leftIcon={require('@assets/icons/ic-qr.png')}
                rounded
              />
            </View>
            <View style={s.footer} />
          </ContentContainer>
          <View style={s.contentWrapper} />
          <View style={landscape ? s.s50 : {}}>
            <BottomButton
              title={I18n.t('text.I do not have a code')}
              onPress={onOpenModal}
              backgroundColor="background"
              textColor="gray3"
              titleStyle={s.dontHaveCodeTitle}
              avoidKeyboard={true}
            />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
      <DoNotHaveCodeModal ref={modalRef} />
    </Container>
  )
}

const s = StyleSheet.create({
  s50: { width: '50%', marginLeft: '50%' },
  container: {
    paddingTop: 0,
  },
  contentWrapper: {
    flex: 1,
  },
  image: {
    height: Metrics.screen.height * 0.27,
    marginBottom: '5%',
    alignSelf: 'center',
  },
  title: {
    alignSelf: 'center',
    marginTop: 17,
  },
  desc: {
    marginHorizontal: 40,
    textAlign: 'center',
    marginTop: 10,
  },
  textField: {
    marginTop: 10,
    marginHorizontal: 20,
  },
  joinGroupBtnContainer: {
    marginTop: 10,
    marginHorizontal: 10,
  },
  footer: {
    height: 40,
  },
  textFieldText: {
    borderWidth: 2,
    maxHeight: 120,
    fontWeight: '500',
  },
  dontHaveCodeTitle: {
    fontWeight: 'normal',
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  alignCenter: { alignItems: 'center' },
  logoutContainer: {
    marginBottom: 0,
    opacity: 0.5,
  },
  logoutText: {
    marginLeft: 8,
  },
})

export default JoinAGroupScreen
