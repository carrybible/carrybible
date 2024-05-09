import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import Loading from '@components/Loading'
import { H1, H2, Title } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import storage from '@react-native-firebase/storage'
import { useNavigation } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'
import { TabView } from 'react-native-tab-view'
import Video from 'react-native-video'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

type ParamProps = {
  tip?: {
    title: string
    content: string
  }
  video: string
}

type Props = StackScreenProps<{ LeaderPromptScreen: ParamProps }, 'LeaderPromptScreen'>

const LeaderPromptScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const { video, tip } = props.route.params
  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string }[] = []
    if (tip) {
      routes.push({
        key: 'tip',
      })
    }
    if (video) {
      routes.push({
        key: 'video',
      })
    }
    return {
      index: 0,
      routes: routes,
    }
  })
  const handleIndexChange = useCallback(
    (index: number) => {
      setNavigationState({ ...navigationState, index })
    },
    [navigationState],
  )
  const handleContinuePress = useCallback(() => {
    if (navigationState.index === navigationState.routes.length - 1) {
      NavigationRoot.pop()
      return
    }
    handleIndexChange(navigationState.index + 1)
  }, [handleIndexChange, navigationState])

  const [showEncourage, setShowEncourage] = useState(true)
  const handleEndAnimation = useCallback(() => {
    setShowEncourage(false)
  }, [])

  const renderScene = useCallback(
    ({ route }) => {
      switch (route.key) {
        case 'tip': {
          if (!tip) {
            return null
          }
          return <LeaderTip title={tip.title} content={tip.content} />
        }
        case 'video': {
          if (!video) {
            return null
          }
          const shouldPlayVideo = navigationState.routes[navigationState.index].key === 'video' && !showEncourage
          return <TrainingVideo video={video} shouldPlayVideo={shouldPlayVideo} />
        }
        default:
          return null
      }
    },
    [navigationState.index, navigationState.routes, showEncourage, tip, video],
  )

  return (
    <Container safe>
      <HeaderBar onPressRight={() => NavigationRoot.pop()} iconRight="x" colorRight={color.text} />
      {showEncourage && <EncourageLeader onEndAnimation={handleEndAnimation} />}
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={navigationState}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={handleIndexChange}
          initialLayout={INITIAL_LAYOUT}
          swipeEnabled={false}
          lazy={Platform.OS === 'android'}
        />
      </View>
      <BottomButton title={I18n.t('text.Continue')} rounded={true} onPress={handleContinuePress} />
    </Container>
  )
}

const EncourageLeader = ({ delay = 500, onEndAnimation }: { delay?: number; onEndAnimation: () => void }) => {
  const { color } = useTheme()
  const encourageTexts = useMemo(() => {
    return ['Leading a group is an honor...', 'And you are making a wonderful impact so far!']
  }, [])
  const [textIndex, setTextIndex] = useState(0)
  const opacity = useRef(new Animated.Value(0)).current
  const wrapperOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, {
        delay: textIndex === 0 ? delay : 0,
        useNativeDriver: true,
        duration: 500,
        easing: Easing.linear,
        isInteraction: true,
        toValue: 1,
      }),
    ]
    if (textIndex < encourageTexts.length - 1) {
      animations.push(
        Animated.timing(opacity, {
          delay: 3000,
          useNativeDriver: true,
          duration: 500,
          easing: Easing.linear,
          isInteraction: true,
          toValue: 0,
        }),
      )
    }
    Animated.sequence(animations).start(() => {
      if (textIndex < encourageTexts.length - 1) {
        setTimeout(() => {
          setTextIndex(textIndex + 1)
        }, 250)
      } else {
        Animated.timing(wrapperOpacity, {
          delay: 3000,
          toValue: 0,
          useNativeDriver: true,
          duration: 250,
          easing: Easing.linear,
        }).start(() => {
          onEndAnimation()
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textIndex])

  return (
    <Animated.View style={[styles.encourageWrapper, { opacity: wrapperOpacity }]}>
      <LottieView
        autoPlay
        source={require('@assets/animations/stars.json')}
        style={[styles.lottie, { backgroundColor: color.background }]}
        loop
      />
      <Title align="center" style={{ width: Metrics.screen.width / 2 }}>
        {I18n.t(`text.You are doing a great job`)}
      </Title>
      {encourageTexts[textIndex] && (
        <Animated.View style={[{ opacity }, styles.encourageText]}>
          <H2 align="center" bold={false}>
            {encourageTexts[textIndex]}
          </H2>
        </Animated.View>
      )}
    </Animated.View>
  )
}

const LeaderTip = ({ title, content }: { title: string; content: string }) => {
  const { color } = useTheme()
  return (
    <View style={styles.leaderTipWrapper}>
      <View style={[styles.iconWrapper, { backgroundColor: color.blue2 }]}>
        <Title align="center" style={styles.iconText}>
          💡
        </Title>
      </View>
      <H1 align="center">{title}</H1>
      <H2 bold={false} align="center" style={styles.tipContent}>
        {content}
      </H2>
    </View>
  )
}

const TrainingVideo = ({ video, shouldPlayVideo }: { video: string; shouldPlayVideo: boolean }) => {
  const navigation = useNavigation()
  const [videoUrl, setVideoUrl] = useState<string | null>()
  const getVideo = useCallback(async () => {
    return await storage().ref(video).getDownloadURL()
  }, [video])

  const [paused, setPaused] = useState(false)

  useEffect(() => {
    getVideo().then(url => setVideoUrl(url))
  }, [getVideo])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async () => {
      setPaused(true)
    })

    return () => {
      unsubscribe?.()
    }
  }, [navigation])

  if (!videoUrl) {
    return <Loading />
  }

  return (
    <View style={styles.videoWrapper}>
      <Video
        paused={paused || !shouldPlayVideo}
        source={{ uri: videoUrl }}
        repeat={false}
        controls={true}
        style={styles.video}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  encourageWrapper: {
    position: 'absolute',
    zIndex: 2,
    width: Metrics.screen.width,
    height: Metrics.screen.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {},
  tabViewContainer: {
    flex: 1,
  },
  encourageText: {
    minHeight: 100,
    marginTop: 30,
    width: '60%',
  },
  iconWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  leaderTipWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconText: {
    fontSize: 50,
  },
  tipContent: {
    opacity: 0.8,
    marginTop: 10,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    borderRadius: 20,
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
})

export default LeaderPromptScreen
