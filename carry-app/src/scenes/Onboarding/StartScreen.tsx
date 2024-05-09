import BottomButton from '@components/BottomButton'
import Button from '@components/Button'
import { H3, Text, Title } from '@components/Typography'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import BottomLogin from '@scenes/Launch/components/BottomLogin'
import { NavigationRoot } from '@scenes/root'
import { Config, Constants, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useMemo, useRef } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { useAttachmentPickerContext } from 'stream-chat-react-native'
import StartBackground from './components/StartBackground'

interface Props {
  onPressContinue?: () => void
}

const StartScreen: React.FC<Props> = () => {
  const { color, typography, changeTheme } = useTheme()
  const bottomModal = useRef<any>()
  const { landscape } = useScreenMode()

  // Fix issue bottom picker show up on Pixel device
  const { closePicker } = useAttachmentPickerContext()
  useEffect(() => {
    closePicker()
  }, [])

  const onPressStart = () => {
    NavigationRoot.navigate(Constants.SCENES.ONBOARDING.JOIN_A_GROUP)
  }

  const onPressLogin = () => {
    bottomModal.current?.open()
  }

  function handleChangeTheme() {
    let themeID = 'light'
    if (color.id === 'light') {
      themeID = 'dark'
    }
    changeTheme(themeID)
  }
  const isCarry = Config.VARIANT === 'carry'

  const MainImage = useMemo(() => <Image style={s.img} resizeMode="contain" source={require('@assets/images/img-join-group.png')} />, [])

  const Info = useMemo(
    () => (
      <View style={s.titleContainer}>
        <Title style={s.titleText}>{I18n.t('text.👋 Welcome to Carry')}</Title>
        <H3 bold={false} style={[s.descriptionText, { color: color.gray2 }]}>
          {I18n.t('text.A space to draw closer to God together')}
        </H3>
      </View>
    ),
    [color.gray2, color.white],
  )

  const Buttons = useMemo(
    () => (
      <View>
        <BottomButton light={false} rounded title={I18n.t('text.Get started')} onPress={onPressStart} />
        <BottomButton
          rounded
          secondary
          style={[
            s.findBtn,
            {
              backgroundColor: !isCarry ? color.transparent : color.background,
              borderColor: !isCarry ? color.lightBackground : color.blue1,
            },
          ]}
          title={I18n.t('text.I already have an account')}
          onPress={onPressLogin}
          light={!isCarry}
        />
        {!isCarry ? (
          <Text color="gray4" style={s.powerCarryText}>
            Powered by Carry
          </Text>
        ) : null}
      </View>
    ),
    [color.background, color.blue1, color.lightBackground, color.transparent, isCarry],
  )

  return (
    <StartBackground>
      {isCarry ? (
        <Button.Full
          text={`${color.name} Theme`}
          onPress={handleChangeTheme}
          textStyle={{ color: color.gray2, fontSize: typography.footnote }}
          style={s.center}
        />
      ) : null}
      <View style={s.container}>
        {landscape ? (
          <ScreenView>
            <View style={s.centerJustify}>{MainImage}</View>
            <View style={s.flex}>{Info}</View>
            {Buttons}
          </ScreenView>
        ) : (
          <>
            <View style={s.flex}>
              {MainImage}
              {Info}
            </View>
            {Buttons}
          </>
        )}
      </View>
      <BottomLogin ref={bottomModal} />
    </StartBackground>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerJustify: { flex: 1, justifyContent: 'center' },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  img: {
    height: Math.min(280, Metrics.screen.width * 0.6),
    width: '90%',
  },
  titleContainer: {
    alignItems: 'center',
    marginHorizontal: '10%',
    marginTop: '8%',
  },
  titleText: {
    textAlign: 'center',
  },
  descriptionText: {
    textAlign: 'center',
    marginTop: 10,
  },
  findBtn: {
    marginTop: 5,
    marginBottom: 25,
  },
  center: {
    alignSelf: 'center',
  },
  powerCarryText: {
    alignSelf: 'center',
    marginBottom: 32,
  },
})

export default StartScreen
