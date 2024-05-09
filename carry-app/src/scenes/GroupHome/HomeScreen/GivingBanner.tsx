import Button from '@components/Button'
import { H3, Subheading } from '@components/Typography'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from '@shared/Config'
import Styles from '@shared/Styles'
import { differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { View, Image, StyleSheet, Linking } from 'react-native'

// Task: Carry Giving Prompt on Mobile - https://github.com/carrybible/carry-issues/issues/582
const GivingBanner: FC<{
  blockIndex: number
  isFinishedStudy?: boolean
}> = ({ blockIndex, isFinishedStudy }) => {
  const { color } = useTheme()
  const [shouldShow, setShouldShow] = useState(false)
  const { easeInEaseOut } = useLayoutAnimation()
  useEffect(() => {
    const run = async () => {
      const lastTime = await AsyncStorage.getItem('@lastimeShowGivingBanner')
      const distance = (lastTime && differenceInDays(new Date(lastTime), new Date())) || 0
      if ((!lastTime || distance < -28) && isFinishedStudy && blockIndex > 2) {
        setShouldShow(true)
      }
    }
    run()
  }, [blockIndex, isFinishedStudy])

  const saveLastTime = useCallback(() => {
    AsyncStorage.setItem('@lastimeShowGivingBanner', new Date().toISOString())
  }, [])

  const onDismiss = useCallback(() => {
    saveLastTime()
    easeInEaseOut()
    setShouldShow(false)
  }, [saveLastTime, easeInEaseOut])

  const onPressHelp = useCallback(() => {
    Linking.openURL(Config.GIVE_URL)
    onDismiss()
  }, [onDismiss])

  if (!shouldShow) return null
  return (
    <View style={[styles.container, { backgroundColor: color.middle }, Styles.shadow2]}>
      <View style={styles.contentContainer}>
        <Image style={styles.icon} resizeMode="contain" source={require('@assets/icons/carry_logo_black.png')} />
        <View style={styles.content}>
          <H3 bold>{I18n.t('text.Help us make ministry impact')}</H3>
          <Subheading color="gray10">{I18n.t('text.Carry is possible thanks to donations from people like you')}</Subheading>
        </View>
      </View>
      <Button.Full
        style={[
          {
            backgroundColor: color.accent,
          },
          styles.btn,
        ]}
        text={I18n.t('text.Yes I want to help')}
        textStyle={[styles.cancel, { color: color.white }]}
        onPress={onPressHelp}
      />
      <Button.Full
        style={styles.btn2}
        text={I18n.t('text.No thanks')}
        textStyle={[styles.cancel, { color: color.gray10 }]}
        onPress={onDismiss}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 15,
    padding: 16,
  },
  contentContainer: {
    flexDirection: 'row',
  },
  icon: {
    width: 85,
    height: 85,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  btn: { borderRadius: 10, marginTop: 24 },
  cancel: { fontWeight: '700' },
  btn2: { marginTop: 6 },
})

export default GivingBanner
