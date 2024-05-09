import { H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useFadeIn from '@hooks/animations/useFadeIn'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import HomeActionButton from '@scenes/GroupHome/HomeScreen/HomeActionButton'
import { NavigationRoot } from '@scenes/root'
import Config from '@shared/Config'
import Constants from '@shared/Constants'
import auth from '@shared/Firestore/auth'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useRef } from 'react'
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Portal } from 'react-native-portalize'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch, useSelector } from 'react-redux'
import { GradientCover } from '../ConnectionView'
import ArrowHint from '../HintArrow'

type IProps = {
  buttonPosY: number
  isFocus?: boolean
  isFinishedStudy?: boolean
  isShowGiving?: boolean
}

const SafeAreaViewAnimated = Animated.createAnimatedComponent(SafeAreaView)

const AfterStudyHint = (props: IProps) => {
  const [show, setShow] = React.useState(false)
  const { color } = useTheme()
  const { isFinishedStudy } = props
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [opacity] = useFadeIn(250, 0, true)
  const dispatch = useDispatch()
  const pressCount = useRef(0)
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (me.isShowDailyFlowNavigationGuide && !me.isShowAfterStudyHint && props.isFocus) {
        setShow(true)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [me, props.isFocus])

  const onPressOutSide = async () => {
    pressCount.current += 1
    if (pressCount.current === 5) {
      setShow(false)
      pressCount.current = 0
      updateData()
    }
  }

  const updateData = () => {
    auth.updateUser({ isShowAfterStudyHint: true })
    dispatch({
      type: TYPES.ME.UPDATE,
      payload: {
        isShowAfterStudyHint: true,
      },
    })
  }

  if (!show || !props.buttonPosY) return null

  return (
    <Portal>
      <SafeAreaViewAnimated style={[s.container, { opacity }]}>
        <Pressable
          onPress={onPressOutSide}
          style={[props.isShowGiving ? { flex: 1, marginTop: props.buttonPosY + (Platform.OS === 'android' ? -84 : -103) } : s.bottom]}>
          <View
            style={[
              s.desc,
              {
                // top: props.buttonPosY + Metrics.header.height + (StatusBar.currentHeight || 0) - 148.11,
              },
            ]}
            // pointerEvents="none"
          >
            <GradientCover borderRadius={15} style={s.gradient}>
              <View style={[{ backgroundColor: color.background }, s.content]}>
                <H3>{I18n.t('Revisit group activity')}</H3>
                <Text style={s.descText}>{I18n.t('text.View previous prayers')}</Text>
              </View>
            </GradientCover>
            <ArrowHint
              colors={Config.VARIANT !== 'carry' ? [color.accent2, color.accent2] : ['rgb(174,157,228)', '#FF88C1']}
              style={s.arrow}
            />
            <View style={s.seperator} />
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <HomeActionButton
                icon="🙏"
                text={I18n.t('text.PRAYER')}
                badgeNumber={(isFinishedStudy && group.groupActions?.prayer.unreadCount) || 0}
                onPress={() => {
                  NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.LISTING, {
                    type: 'prayer',
                  })
                  updateData()
                  setShow(false)
                }}
              />
              <HomeActionButton
                icon="🎉"
                text={I18n.t('text.GRATITUDE')}
                badgeNumber={(isFinishedStudy && group.groupActions?.gratitude.unreadCount) || 0}
                onPress={() => {
                  NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.LISTING, {
                    type: 'gratitude',
                  })
                  updateData()
                  setShow(false)
                }}
              />
              <HomeActionButton
                icon="💬"
                text={I18n.t('text.DISCUSSION')}
                badgeNumber={(isFinishedStudy && group.discussionCount) || 0}
                onPress={() => {
                  NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.DISCUSSIONS)
                  updateData()
                  setShow(false)
                }}
              />
              {group.org?.giving?.allowSetup && group.org?.giving?.isConnected && (
                <HomeActionButton
                  icon="🤝"
                  text={I18n.t('text.GIVING')}
                  badgeNumber={(isFinishedStudy && group.discussionCount) || 0}
                  onPress={() => {
                    NavigationRoot.push(Constants.SCENES.GROUP.GIVING_CAMPAIGNS)
                    updateData()
                    setShow(false)
                  }}
                />
              )}
            </View>
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
  seperator: {
    height: 20,
  },
  desc: {
    marginHorizontal: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descText: {
    marginTop: 10,
    marginLeft: 8,
  },
  bottom: { flex: 1, justifyContent: 'flex-end', marginBottom: 47 },
  arrow: { marginTop: -3 },
  gradient: { marginHorizontal: 20, height: Platform.OS === 'android' ? 123 : 113, width: Metrics.screen.width - 40 },
  content: { margin: 3, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 20, height: Platform.OS === 'android' ? 115 : 106 },
})

export default AfterStudyHint
