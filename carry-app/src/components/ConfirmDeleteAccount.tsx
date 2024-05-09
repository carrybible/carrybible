import Button from '@components/Button'
import { H2, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Config, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { TabView } from 'react-native-tab-view'

interface Props {
  onConfirm: () => void
  onCancel?: () => void
  initCountdown?: number
  onLoginAndDelete: () => void
}

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const ConfirmDeleteAccount: React.ForwardRefRenderFunction<
  {
    show: () => void
    handleIndexChange: (number) => void
    close: () => void
  },
  Props
> = (props, ref) => {
  const { onCancel, onConfirm, initCountdown = 3, onLoginAndDelete } = props
  const { color } = useTheme()
  const modal = useRef<Modalize>(null)
  const countdownIntervalRef = useRef<any>(null)
  const [countdown, setCountdown] = useState(initCountdown)

  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string }[] = [{ key: 'remove-account' }, { key: 'login-to-remove' }]
    return {
      index: 0,
      routes,
    }
  })

  const handleIndexChange = React.useCallback(
    (index: number) => {
      setNavigationState({ ...navigationState, index })
    },
    [navigationState],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'remove-account':
        return (
          <View style={s.content}>
            <Text style={s.titleIcon}>{'✋'}</Text>
            <H2 bold style={s.title}>
              {I18n.t('text.Are you sure')}
            </H2>
            <Text color="gray" style={s.desc}>
              {I18n.t('text.delete_account_confirm', {
                appName: Config.APP_NAME,
              })}
            </Text>

            <Button.Full
              style={[
                {
                  backgroundColor: color.red,
                },
                s.btnFull,
              ]}
              text={countdown > 0 ? countdown.toString() : I18n.t('text.Delete my account')}
              textStyle={[s.textFull, { color: color.white }]}
              onPress={() => {
                // modal.current?.close()
                onConfirm()
              }}
              disabled={countdown > 0}
            />
            <Button.Full
              text={I18n.t('text.Cancel')}
              textStyle={[s.textCancel, { color: color.gray }]}
              onPress={() => {
                modal.current?.close()
                onCancel?.()
              }}
            />
          </View>
        )
      case 'login-to-remove':
        return (
          <View style={s.content}>
            <Text style={s.titleIcon}>{'⛔'}</Text>
            <H2 bold style={s.title}>
              {I18n.t('text.Login to delete account')}
            </H2>
            <Text color="gray" style={s.desc}>
              {I18n.t('text.To fully delete your account we need you to login again')}
            </Text>

            <Button.Full
              style={[
                {
                  backgroundColor: color.red,
                },
                s.btnFull,
              ]}
              text={I18n.t('text.Login')}
              textStyle={[s.textFull, { color: color.white }]}
              onPress={() => {
                onLoginAndDelete()
              }}
            />
            <Button.Full
              text={I18n.t('text.Cancel')}
              textStyle={[s.textCancel, { color: color.gray }]}
              onPress={() => {
                handleIndexChange(0)
                modal.current?.close()
                onCancel?.()
              }}
            />
          </View>
        )
    }
  }

  useImperativeHandle(ref, () => ({
    show: () => {
      if (modal.current) {
        modal.current.open()
        setTimeout(() => {
          countdownIntervalRef.current = setInterval(() => {
            setCountdown(countdown => countdown - 1)
          }, 1000)
        }, 200)
      }
    },
    close: () => modal.current?.close(),
    handleIndexChange,
  }))

  return (
    <Modalize
      ref={modal}
      onClosed={() => {
        handleIndexChange(0)
        clearInterval(countdownIntervalRef.current)
        setCountdown(initCountdown)
      }}
      disableScrollIfPossible
      adjustToContentHeight
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      // FooterComponent={<View style={{ height: Metrics.safeArea.bottom }} />}
    >
      <View style={s.view}>
        <TabView
          navigationState={navigationState}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={handleIndexChange}
          initialLayout={INITIAL_LAYOUT}
          swipeEnabled={false}
          lazy
        />
      </View>
    </Modalize>
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  view: { height: 340 },
  content: { marginVertical: Metrics.insets.vertical, alignItems: 'center' },
  title: { marginVertical: 20, textAlign: 'center' },
  desc: { marginHorizontal: Metrics.insets.horizontal * 2, textAlign: 'center', marginBottom: 15 },
  btnFull: { borderRadius: 10, marginHorizontal: Metrics.insets.horizontal, marginVertical: Metrics.insets.vertical },
  textFull: { fontWeight: '700', flex: 1 },
  textCancel: { fontWeight: '500', flex: 1 },
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
})

export default React.forwardRef(ConfirmDeleteAccount)
