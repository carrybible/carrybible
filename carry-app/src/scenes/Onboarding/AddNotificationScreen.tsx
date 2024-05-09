/**
 * Enable Notifications Page
 *
 * @format
 *
 */
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import { H1, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Config, Constants, LocalStorage, Notification, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useMemo, useEffect, useRef, useState } from 'react'
import { AppState, Image, Linking, Platform, StyleSheet, View } from 'react-native'
import { getOpacityColor } from 'src/config/color'

interface Props {
  route: any
  navigation: any
}

const AddNotificationScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const [loading, setLoading] = useState<boolean>(false)
  const appState = useRef(AppState.currentState)
  const finishedFlow = useRef(false)
  const { onContinue } = props.route.params
  const Analytics = useAnalytic()

  useEffect(() => {
    LocalStorage.storeData(LocalStorage.keys.ASKED_NOTIFICATION, { asked: true })
    AppState.addEventListener('change', _handleAppStateChange)
    return () => {
      AppState.removeEventListener('change', _handleAppStateChange)
    }
  }, [])

  const _handleAppStateChange = nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (finishedFlow.current === false) getPermission(false)
    }
    appState.current = nextAppState
  }

  const onPressEnable = async () => {
    Analytics.event(Constants.EVENTS.NOTIFICATION.ALLOW)
    getPermission()
    finishedFlow.current = true
  }

  const getPermission = async (goToSettings = true) => {
    setLoading(true)
    let granted = false
    try {
      granted = await Notification.hasPermission()
      if (!granted) {
        granted = await Notification.requestPermission()
      } else {
        if (goToSettings && Platform.OS === 'ios') Linking.openURL('app-settings:')
      }

      if (granted) {
        await Notification.init()
      }
    } catch (e: any) {
      devLog(e.message)
    }

    if (granted) {
      toast.success(I18n.t('text.Permission granted'))
      LocalStorage.storeData(LocalStorage.keys.ENABLE_NOTIFICATION, { enable: true })
      Analytics.event(Constants.EVENTS.NOTIFICATION.GRANTED)
      onPressContinue(false)
    } else {
      Analytics.event(Constants.EVENTS.NOTIFICATION.DENIED)
    }
    setLoading(false)
  }

  const onPressContinue = async (isSkip = true) => {
    finishedFlow.current = true
    isSkip && Analytics.event(Constants.EVENTS.NOTIFICATION.SKIP)
    onContinue?.()
    NavigationRoot.pop()
  }

  const appIcon = useMemo(() => {
    switch (Config.VARIANT) {
      default:
        return <Image source={require(`@assets/icons/ic-carry-app.png`)} style={s.iconCarry} />
    }
  }, [])

  return (
    <Container safe>
      <View style={s.headerView}>
        <H1>{I18n.t('text.Never miss out')}</H1>
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View style={[s.iconContainer, { backgroundColor: color.id === 'light' ? getOpacityColor(color.accent2, 0.25) : '#4F4F4F' }]}>
          <Text style={s.icon}>🔔</Text>
        </View>
        <Text style={s.descText}>{I18n.t('text.Get notfied when group members share life updates or reply to you')}</Text>
      </View>
      <View style={[{ backgroundColor: color.middle }, s.sampleNotification]}>
        <View style={s.topSampleNotification}>
          <View style={s.topLeftSampleNotification}>
            {appIcon}
            <Text style={s.text}>{Config.APP_NAME}</Text>
          </View>
          <View>
            <Text style={s.text}>now</Text>
          </View>
        </View>
        <Text style={s.sampleContent}>{I18n.t('text.Kate responded to your prayer request. Tap to view')}</Text>
      </View>
      <View style={s.bottomButtons}>
        <BottomButton rounded title={I18n.t('text.Allow notifications')} onPress={onPressEnable} loading={loading} style={s.allowButton} />
        <BottomButton
          style={{
            backgroundColor: color.background,
          }}
          title={I18n.t('text.Maybe later')}
          titleStyle={[{ color: color.gray }, s.skipButtonTitle]}
          onPress={onPressContinue}
          loading={loading}
        />
      </View>
    </Container>
  )
}

AddNotificationScreen.defaultProps = {}

const s = StyleSheet.create({
  headerView: {
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: 60,
  },
  icon: {
    fontSize: 50,
  },
  text: { color: '#828282' },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 135,
    height: 135,
    borderRadius: 67.5,
    marginTop: 25,
  },
  descText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#828282',
  },
  sampleNotification: {
    marginTop: 50,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    ...Styles.shadow2,
  },
  sampleContent: {
    marginTop: 12,
    marginBottom: 12,
    width: '90%',
  },
  topSampleNotification: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topLeftSampleNotification: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCarry: {
    marginRight: 8,
    height: 20,
    width: 20,
  },
  bottomButtons: { bottom: 0, position: 'absolute', left: 0, right: 0 },
  allowButton: { marginBottom: 0 },
  skipButtonTitle: { fontWeight: 'normal' },
})

export default AddNotificationScreen
