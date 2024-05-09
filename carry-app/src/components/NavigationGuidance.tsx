import TransparentNavigation from '@components/TransparentNavigation'
import { H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { GradientCover } from '@scenes/GroupHome/components/ConnectionView'
import ArrowHint from '@scenes/GroupHome/components/HintArrow'
import Config from '@shared/Config'
import auth from '@shared/Firestore/auth'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React from 'react'
import { Modal, Platform, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

const NavigationGuidance: React.FC = () => {
  const dispatch = useDispatch()
  const [visible, setVisible] = React.useState(false)
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { color } = useTheme()
  const { landscape } = useScreenMode()
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!me.isShowDailyFlowNavigationGuide) {
        setVisible(true)
        auth.updateUser({ isShowDailyFlowNavigationGuide: true })
        dispatch({
          type: TYPES.ME.UPDATE,
          payload: {
            isShowDailyFlowNavigationGuide: true,
          },
        })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [dispatch, me.isShowDailyFlowNavigationGuide])

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent={true}
      onRequestClose={() => {
        setVisible(false)
      }}>
      <GestureHandlerRootView style={[styles.container, landscape ? styles.landscape : {}]}>
        <View style={[styles.background, landscape ? styles.landscape : {}]} />
        <View style={styles.lottieWrapper}>
          <GradientCover style={landscape ? styles.gradientLand : styles.gradient} borderRadius={15}>
            <View style={[styles.content, { backgroundColor: color.background }]}>
              <H3>{I18n.t('Tap to continue')}</H3>
              <Text style={styles.descText}>{I18n.t('text.Navigate to whats next by tapping on sides of the screen')}</Text>
            </View>
          </GradientCover>
          <ArrowHint
            style={styles.arrow}
            colors={Config.VARIANT !== 'carry' ? [color.accent2, color.accent2] : ['rgb(244,128,190)', 'rgb(240,130,193)']}
          />
          <LottieView source={require('@assets/animations/handClick.json')} style={styles.lottieAnim} autoPlay loop />
        </View>
        <TransparentNavigation
          mode="right"
          width={Metrics.insets.horizontal * 2}
          onPress={() => {
            setVisible(false)
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  landscape: {
    width: Metrics.screen.height,
    height: Metrics.screen.width,
  },
  container: {
    flex: 1,
    width: Metrics.screen.width,
    height: Metrics.screen.height,
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    opacity: 0.7,
    backgroundColor: 'black',
    width: Metrics.screen.width,
    height: Metrics.screen.height,
  },
  descText: {
    marginTop: 10,
  },
  lottieWrapper: {
    flexDirection: 'row',
  },
  lottieAnim: {
    width: 100,
    height: 100,
    marginLeft: -10,

    alignSelf: 'flex-end',
    transform: [
      {
        rotateZ: '35deg',
      },
    ],
  },
  gradient: { width: Metrics.screen.width - 110, height: Platform.OS === 'android' ? 123 : 113, marginLeft: 16 },
  gradientLand: { width: Metrics.screen.height - 110, height: Platform.OS === 'android' ? 123 : 113, marginLeft: 16 },
  content: { margin: 3, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 20, height: Platform.OS === 'android' ? 116 : 107 },
  arrow: { transform: [{ rotateZ: '-90deg' }], alignSelf: 'center', marginLeft: -5 },
})

export default NavigationGuidance
