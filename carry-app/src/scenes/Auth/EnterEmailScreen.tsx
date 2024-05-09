import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import TextField from '@components/TextField'
import { H2, Text } from '@components/Typography'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import auth from '@shared/Firestore/auth'
import { Constants, Metrics } from '@shared/index'
import { isValidEmail } from '@shared/Utils'
import cc from 'color'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { Animated, Image, Keyboard, StyleSheet, TouchableWithoutFeedback, View, ScrollView } from 'react-native'

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ EnterEmailScreen: ParamProps }, 'EnterEmailScreen'>

const EnterEmailScreen: React.FC<Props> = () => {
  const { color: theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const keyboardPadding = useKeyboardPadding({ androidEnable: false, extraPadding: -40 })

  const onPressSendEmail = async () => {
    setLoading(true)
    const success = await auth.login.email(email)
    setLoading(false)
    if (success) NavigationRoot.replace(Constants.SCENES.AUTH.CHECK_YOUR_INBOX, { email })
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
      <ScrollView>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <Animated.View style={[s.content__container, { transform: [{ translateY: keyboardPadding }] }]}>
            <ScreenView>
              <View style={s.head}>
                <View style={s.intro__container}>
                  <H2 bold style={s.titleText}>
                    {I18n.t('text.Enter your email address')}
                  </H2>

                  <Image source={require('@assets/images/enter-email.png')} style={s.image} resizeMode="contain" />
                </View>
              </View>
              <Text style={s.des}>{I18n.t('text.Enter email desc')}</Text>

              <View style={s.content}>
                <View style={s.actions__container}>
                  <TextField
                    id="name"
                    label={I18n.t('text.Email address')}
                    numberOfLines={1}
                    placeholderTextColor={theme.gray3}
                    maxLength={80}
                    onChangeText={(_id, text) => {
                      setEmail(text)
                    }}
                    containerStyle={[s.textField__container]}
                    style={[
                      s.textField,
                      !email && {
                        backgroundColor: cc(theme.background).mix(cc(theme.gray6), 0.4).hex(),
                        borderColor: cc(theme.middle).mix(cc(theme.gray4), 0.4).hex(),
                      },
                    ]}
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>
              </View>
              <BottomButton
                style={s.createGroupBtn}
                title={I18n.t('text.Send access link')}
                rounded
                disabled={!isValidEmail(email)}
                onPress={onPressSendEmail}
                loading={loading}
                avoidKeyboard={false}
                keyboardVerticalOffset={50}
              />
            </ScreenView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
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

  actions__container: {
    flexGrow: 0.5,
  },
  textField__container: {
    marginBottom: 15,
    borderRadius: 7,
    marginTop: 45,
  },
  textField: {
    maxHeight: 120,
    fontWeight: '300',
    borderWidth: 2,
  },
  createGroupBtn: {
    marginBottom: 20,
    marginHorizontal: 0,
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
  },
  head: { marginTop: 20 },
})

export default EnterEmailScreen
