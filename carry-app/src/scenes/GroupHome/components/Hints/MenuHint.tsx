import Avatar from '@components/Avatar'
import { H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useFadeIn from '@hooks/animations/useFadeIn'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import Config from '@shared/Config'
import auth from '@shared/Firestore/auth'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useRef } from 'react'
import { Platform, Pressable, StatusBar, StyleSheet, TouchableOpacity, View, Animated } from 'react-native'
import { Portal } from 'react-native-portalize'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch, useSelector } from 'react-redux'
import { GradientCover } from '../ConnectionView'
import ArrowHint from '../HintArrow'

type IProps = {
  buttonPosY: number
  isFocus?: boolean
  onPress: () => void
}

const SafeAreaViewAnimated = Animated.createAnimatedComponent(SafeAreaView)

const MenuHint = (props: IProps) => {
  const [show, setShow] = React.useState(false)
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const pressCount = useRef(0)
  const dispatch = useDispatch()
  const [opacity] = useFadeIn(250, 0, true)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!me.isShowMenuHint && me.isShowAfterStudyHint && props.isFocus) {
        setShow(true)
        dispatch({
          type: TYPES.ME.UPDATE,
          payload: {
            isShowMenuHint: true,
          },
        })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [me, dispatch, props.isFocus])

  const onPressOutSide = async () => {
    pressCount.current += 1
    if (pressCount.current === 5) {
      setShow(false)
      pressCount.current = 0
    }
  }

  const onPressMenu = () => {
    auth.updateUser({ isShowMenuHint: true })

    setShow(false)
    pressCount.current = 5
    props.onPress()
  }

  if (!show) {
    return null
  }

  return (
    <Portal>
      <SafeAreaViewAnimated style={[s.container, { opacity }]}>
        <Pressable onPress={onPressOutSide} style={s.flex1}>
          <TouchableOpacity
            style={{ marginTop: (StatusBar.currentHeight || 0) + (Platform.OS === 'android' ? 4 : 0) }}
            onPress={onPressMenu}>
            <Avatar url={group?.image} size={40} pressable={false} style={s.avatar} />
          </TouchableOpacity>
          <View style={s.hint} pointerEvents="none">
            <GradientCover borderRadius={15} style={s.gradient}>
              <View style={[{ backgroundColor: color.background }, s.content]}>
                <H3>{I18n.t('text.Ic Group settings')}</H3>
                <Text style={s.descText}>{I18n.t('text.Tap here to view group members and other menu items')}</Text>
              </View>
            </GradientCover>
            <ArrowHint
              style={s.arrow}
              colors={Config.VARIANT !== 'carry' ? [color.accent2, color.accent2] : ['rgb(174,157,228)', 'rgb(150,147,241)']}
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
  hint: {
    position: 'absolute',
    top: Metrics.header.height + (Platform.OS === 'ios' ? 6 : 30) + 24,
  },
  gradient: { marginHorizontal: 10, width: 200, height: 136 },
  content: {
    margin: 3,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 20,
    height: 130,
  },
  descText: {
    marginTop: 10,
  },
  flex1: { flex: 1 },
  avatar: {
    marginLeft: 15,
    marginTop: Platform.OS === 'ios' ? 5 : 4,
  },
  arrow: {
    position: 'absolute',
    top: -22,
    left: 22.5,
    transform: [{ rotateZ: '180deg' }],
  },
})

export default MenuHint
