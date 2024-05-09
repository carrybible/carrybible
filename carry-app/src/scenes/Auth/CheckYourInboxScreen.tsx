import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { H2, Text } from '@components/Typography'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import auth from '@shared/Firestore/auth'
import { Constants, Metrics } from '@shared/index'
import { isValidEmail } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { Animated, Image, Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

type ParamProps = {
  email: string
}

type Props = StackScreenProps<{ CheckYourInboxScreen: ParamProps }, 'CheckYourInboxScreen'>

const CheckYourInboxScreen: React.FC<Props> = props => {
  const email = props.route.params?.email || ''
  const [loading, setLoading] = useState(false)
  const { color: theme } = useTheme()

  const keyboardPadding = useKeyboardPadding({ androidEnable: false })

  const onPressNotFound = async () => {
    setLoading(true)
    const success = await auth.login.email(email)
    setLoading(false)
    if (success) NavigationRoot.navigate(Constants.SCENES.AUTH.RESEND_EMAIL_MODAL, { email })
  }

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={`${theme.text}50`}
        iconLeftSize={22}
        onPressLeft={() => NavigationRoot.pop()}
      />

      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <Animated.View style={[s.content__container, { transform: [{ translateY: keyboardPadding }] }]}>
          <ScreenView>
            <View style={s.head}>
              <View style={s.intro__container}>
                <H2 bold style={s.titleText}>
                  {I18n.t('text.Check your inbox')}
                </H2>

                <Image source={require('@assets/images/check-email.png')} style={s.image} resizeMode="contain" />
              </View>
            </View>
            <Text style={s.des}>
              {I18n.t('text.Sent to email')}
              <Text style={s.email}>{email}</Text>
            </Text>

            <View style={s.content} />
            <BottomButton
              style={s.notFound}
              title={I18n.t('text.Not found email')}
              rounded
              disabled={!isValidEmail(email)}
              onPress={onPressNotFound}
              avoidKeyboard={false}
              keyboardVerticalOffset={50}
              textColor={'text'}
              titleStyle={s.btn}
              loading={loading}
            />
          </ScreenView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Container>
  )
}

const s = StyleSheet.create({
  content__container: {
    flex: 1,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingTop: 10,
  },
  titleText: {
    alignSelf: 'center',
  },
  intro__container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  btn: { fontWeight: '300', fontSize: 16, opacity: 0.6 },
  notFound: {
    marginBottom: 20,
    marginHorizontal: 0,
    backgroundColor: 'transparent',
  },
  content: { flex: 1, justifyContent: 'flex-start' },
  image: {
    height: Metrics.screen.height * 0.34,
    marginBottom: '5%',
    alignSelf: 'center',
    marginTop: 20,
  },
  des: {
    textAlign: 'center',
    marginTop: 25,
  },
  head: { marginTop: 20 },
  email: { fontWeight: '600', textAlign: 'center', opacity: 0.6, marginTop: 10 },
})

export default CheckYourInboxScreen
