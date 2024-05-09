import Container from '@components/Container'
import Loading from '@components/Loading'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { useFocusEffect } from '@react-navigation/native'
import { useNavigateToCreateGroupScreen } from '@scenes/GroupCreation/CreateGroupScreen'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, LocalStorage, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { AppState, StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { EasingNode, useValue } from 'react-native-reanimated'
import Video from 'react-native-video'
import { useSelector } from 'react-redux'
import IconButton from './components/IconButton'

interface Props {
  route: any
  navigation: any
}

const paddingBottomView = 50

const OnboardingVideo: React.FC<Props> = props => {
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const appState = useRef(AppState.currentState)
  const [loading] = useState<boolean>(false)
  const [isPausing, setPause] = useState<boolean>(true)
  const [isEnd, setEnd] = useState<boolean>(false)
  const springAnim = useRef<any>()
  const processValue = useValue(0)
  const ref = useRef<any>()
  const clipInfo = useRef<any>()
  const pauseByUser = useRef<boolean>(false)
  const Analytics = useAnalytic()

  const navigateToCreateGroup = useNavigateToCreateGroupScreen({ isOnboarding: true })

  useFocusEffect(() => {
    if (!pauseByUser.current) setPause(false)
  })

  useEffect(() => {
    LocalStorage.storeData(LocalStorage.keys.PREVIEW_GOAL_INTRO, {})
    // LocalStorage.saveOnboardingState(Constants.SCREENS.ON_BOARDING.VIDEO, props?.route?.params)
    AppState.addEventListener('change', _handleAppStateChange)
    return () => {
      AppState.removeEventListener('change', _handleAppStateChange)
    }
  }, [])

  const _handleAppStateChange = nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // only pause, never play continue
    }
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      setPause(true)
    }
    appState.current = nextAppState
  }

  if (loading) return <Loading />

  const videoError = () => {
    toast.error(I18n.t('error.Unable to load video'))
    setEnd(true)
  }

  const onPressResume = () => {
    setPause(false)
    pauseByUser.current = false
  }

  const onPressPause = () => {
    setPause(true)
    pauseByUser.current = true
  }

  const onPressSkip = () => {
    pauseByUser.current = true
    Analytics.event(Constants.EVENTS.ON_BOARDING.SKIPS_VIDEO)
    props.navigation.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
      title: I18n.t('text.Are you sure about that'),
      description: I18n.t('text.This video explains how you can get the most out of Carry'),
      confirmTitle: I18n.t('text.Yes'),
      cancelTitle: I18n.t('text.Cancel'),
      onConfirm: () => onPressContinue(),
    })
  }

  const onPressContinue = () => {
    pauseByUser.current = true

    setTimeout(() => {
      if (props.route?.params?.isFromOnboarding) {
        if (me.uid) {
          NavigationRoot.home()
        } else {
          NavigationRoot.replace(Constants.SCENES.ONBOARDING.START_SCREEN)
        }
      } else {
        navigateToCreateGroup()
      }
    }, 500)
  }

  const onPressReplay = ({ replayTime = 0 }) => {
    Analytics.event(Constants.EVENTS.ON_BOARDING.REPLAYS_VIDEO)
    if (ref.current) {
      ref.current.seek(replayTime)
    } else {
      return
    }
    if (isPausing) onPressResume()
    if (isEnd) setEnd(false)
  }

  const onProgress = value => {
    if (isPausing || !value.currentTime) return
    const percent = value.currentTime / clipInfo.current?.duration
    const nextValue = percent * (Metrics.screen.width - paddingBottomView * 2)
    changeProcessBar(nextValue)
  }

  const onLoad = value => {
    clipInfo.current = value
  }

  const onEnd = () => {
    setEnd(true)
  }

  const changeProcessBar = nextValue => {
    if (springAnim.current) {
      springAnim.current.stop()
    }
    springAnim.current = Animated.timing(processValue, {
      toValue: nextValue,
      duration: 100,
      easing: EasingNode.inOut(EasingNode.ease),
    })
    springAnim.current.start(() => {
      springAnim.current = null
    })
  }
  return (
    <Container safe={false} backgroundColor={color.middle} barStyle="light-content">
      <TouchableOpacity style={s.video__container} onPress={onPressPause} activeOpacity={1}>
        <Container safe backgroundColor={color.middle}>
          <Video
            source={require('@assets/videos/create-group-video.mp4')}
            ref={ref}
            paused={isPausing}
            onError={videoError}
            onProgress={onProgress}
            onLoad={onLoad}
            onEnd={onEnd}
            rate={1}
            style={s.video}
            resizeMode="cover"
            ignoreSilentSwitch="ignore"
            playInBackground={false}
          />
        </Container>
        {isPausing || isEnd ? (
          isEnd ? (
            <View style={s.overlayContainer}>
              <IconButton title={I18n.t('text.Replay')} icon="rotate-ccw" style={s.btn} onPress={onPressReplay} />
              <IconButton title={I18n.t('text.Continue')} icon="arrow-right-circle" style={s.btn} onPress={onPressContinue} />
            </View>
          ) : (
            <View style={s.overlayContainer}>
              <IconButton title={I18n.t('text.Resume')} icon="play" style={s.btn} onPress={onPressResume} />
              <IconButton title={I18n.t('text.Replay')} icon="rotate-ccw" style={s.btn} onPress={onPressReplay} />
              <IconButton title={I18n.t('text.Skip')} icon="x-circle" style={s.btn} onPress={onPressSkip} />
            </View>
          )
        ) : null}
      </TouchableOpacity>
      <View style={s.bottomContainer}>
        <View style={[s.bottomPlaceholder, { backgroundColor: color.black }]} />
        <Animated.View style={[s.process, { backgroundColor: color.white, width: processValue }]} />
      </View>
    </Container>
  )
}

OnboardingVideo.defaultProps = {}

const s = StyleSheet.create({
  video__container: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    left: 16,
    right: 0,
    top: 0,
    bottom: 16,
    borderRadius: 20,
    width: Metrics.screen.width - 32,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1,1,1,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 50,
  },
  btn: { flex: 1 },
  bottomContainer: {
    position: 'absolute',
    left: paddingBottomView,
    bottom: 44,
    right: paddingBottomView,
    height: 60,
    paddingTop: 30,
  },
  bottomPlaceholder: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    width: '100%',
    minWidth: 3,
  },
  process: { height: 6, borderRadius: 3 },
})

export default OnboardingVideo
