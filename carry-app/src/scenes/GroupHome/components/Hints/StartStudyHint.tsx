import { H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useFadeIn from '@hooks/animations/useFadeIn'
import useTheme from '@hooks/useTheme'
import Config from '@shared/Config'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import { delay } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { FC, useRef, useState } from 'react'
import { Platform, Pressable, StatusBar, StyleSheet, TouchableOpacity, View, Animated, LayoutChangeEvent } from 'react-native'
import { Portal } from 'react-native-portalize'
import SafeAreaView from 'react-native-safe-area-view'
import { useSelector } from 'react-redux'
import { GradientCover } from '../ConnectionView'
import ArrowHint from '../HintArrow'

type IProps = {
  buttonText: string
  buttonPosY: number
  isStarted?: boolean
  onPress: () => void
}

const SafeAreaViewAnimated = Animated.createAnimatedComponent(SafeAreaView)

const StartStudyHint: FC<IProps> = props => {
  const [show, setShow] = React.useState(false)
  const { color, typography } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const pressCount = useRef(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [opacity] = useFadeIn(250, 0, true)
  React.useEffect(() => {
    const checkOverlay = async () => {
      if (group.id && me.uid) {
        const shouldShowOverlay = me.buttonOverlayGroups?.includes(group.id)
        if (shouldShowOverlay && props.isStarted) {
          setShow(true)
        }
      }
    }
    checkOverlay()
  }, [group, me, props.isStarted])

  const onPressOutSide = async () => {
    pressCount.current += 1
    if (pressCount.current === 5) {
      await Firestore.User.removeGroupFromOverlay(group.id)
      setShow(false)
      pressCount.current = 0
    }
  }

  const onPressStartStudy = async () => {
    setShow(false)
    pressCount.current = 0
    props.onPress()
    await delay(2000)
    await Firestore.User.removeGroupFromOverlay(group.id)
  }

  const onContentLayout = (e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height)
  }

  if (!show) return null
  return (
    <Portal>
      <SafeAreaViewAnimated style={[s.container, { opacity }]}>
        <Pressable onPress={onPressOutSide} style={s.flex1}>
          <TouchableOpacity
            onPress={onPressStartStudy}
            style={[
              s.studyButton,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                backgroundColor: props.buttonPosY ? color.accent : 'transparent',
                top: props.buttonPosY + Metrics.header.height + (StatusBar.currentHeight || 0) + (Platform.OS === 'ios' ? 10 : 13),
              },
            ]}
            activeOpacity={0.8}
            delayPressIn={0.1}>
            <Text
              style={[
                s.studyButtonText,
                {
                  color: color.white,
                  fontSize: typography.h2,
                },
              ]}>
              {props.buttonText}
            </Text>
          </TouchableOpacity>
          <View
            style={[
              s.desc,
              { top: props.buttonPosY + Metrics.header.height + (StatusBar.currentHeight || 0) + (Platform.OS === 'ios' ? 23 : 23) + 24 },
            ]}
            pointerEvents="none">
            <GradientCover style={[s.gradient, !!contentHeight && { height: contentHeight + 6 }]} borderRadius={15}>
              <View style={[s.content, { backgroundColor: color.background }]} onLayout={onContentLayout}>
                <H3>{I18n.t('text.Tap to begin')}</H3>
                <Text style={s.descText}>
                  {group.isOwner
                    ? I18n.t('Let set the tone for your group')
                    : I18n.t('text.Start today s study by tapping on the button above')}
                </Text>
              </View>
            </GradientCover>
            <ArrowHint
              style={s.arrow}
              colors={Config.VARIANT !== 'carry' ? [color.accent2, color.accent2] : ['rgb(202,145,213)', 'rgb(212,141,207)']}
            />
          </View>
        </Pressable>
      </SafeAreaViewAnimated>
    </Portal>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    ...StyleSheet.absoluteFillObject,
  },
  arrow: { position: 'absolute', top: -22, left: '50%', marginLeft: -14, transform: [{ rotateZ: '180deg' }] },
  gradient: { marginHorizontal: 20, height: Platform.OS === 'android' ? 193 : 173, width: 200 },
  content: { margin: 3, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 20 },
  studyButton: {
    height: 55,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: Metrics.insets.horizontal + 12,
    backgroundColor: 'red',
  },
  studyButtonText: {
    fontWeight: 'bold',
  },
  desc: {
    marginHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descText: {
    marginVertical: 10,
  },
  flex1: { flex: 1 },
})

export default StartStudyHint
