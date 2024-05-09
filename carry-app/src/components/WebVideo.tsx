import { StudyPlan } from '@dts/study'
import { wait } from '@shared/Utils'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'
import Video from 'react-native-video'
import IconButton from '@scenes/Onboarding/components/IconButton'
import Loading from './Loading'
import I18n from 'i18n-js'
import Metrics from '@shared/Metrics'
const VIDEO_WIDTH = Metrics.screen.width - 32

export const LoadingContainer: React.FC<{
  isReady: boolean
  children: React.ReactNode
}> = ({ isReady, children }) => {
  const opacity = useRef(new Animated.Value(0)).current

  const animation = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity])

  useEffect(() => {
    if (isReady) {
      animation()
    }
  }, [animation, isReady])

  return (
    <View style={s.loadingWrapper}>
      <Animated.View style={[s.loadingContent, { opacity }]}>{children}</Animated.View>
      {!isReady && (
        <View style={s.loading}>
          <Loading />
        </View>
      )}
    </View>
  )
}

const WebVideo = ({
  video,
  shouldHideVideo,
  controlStyle,
}: {
  video: StudyPlan.VideoAct
  shouldHideVideo: boolean
  controlStyle?: StyleProp<ViewStyle>
}) => {
  const [videoReady, setVideoReady] = useState(false)
  const [layoutReady, setLayoutReady] = useState(false)
  const [pause, setPause] = useState(true)
  const [isEnd, setEnd] = useState<boolean>(false)
  const ref = useRef<any>()
  const { service, url, vertical } = video

  const onPressPause = () => {
    setPause(true)
  }

  const onPressPlay = () => {
    if (isEnd) {
      ref.current?.seek(0)
      setEnd(false)
    }
    setPause(false)
  }

  const onEnd = () => {
    setEnd(true)
  }

  useEffect(() => {
    const run = async () => {
      await wait(500) // wait for modal openned
      setLayoutReady(true)
    }

    run()
  }, [])

  useEffect(() => {
    if (shouldHideVideo) {
      setPause(true)
    }
  }, [shouldHideVideo])

  if (service !== 'web' || !url) {
    return null
  }

  return (
    <LoadingContainer isReady={videoReady}>
      {layoutReady ? (
        <TouchableWithoutFeedback onPress={onPressPause}>
          <Video
            ref={ref}
            source={{
              uri: url,
            }}
            paused={pause}
            onError={error => {
              setVideoReady(true)
              devLog('Failed to load video', error, url)
              toast.error(I18n.t('text.Failed to load video'))
            }}
            onLoad={() => {
              setVideoReady(true)
            }}
            onEnd={onEnd}
            rate={1}
            style={vertical ? s.verticalWebVideo : s.horizontalWebVideo}
            resizeMode="cover"
            ignoreSilentSwitch="ignore"
          />
        </TouchableWithoutFeedback>
      ) : null}
      {(pause || isEnd) && (
        <View style={[s.control, controlStyle]}>
          <IconButton
            title={isEnd ? I18n.t('text.Resume') : I18n.t('text.Play')}
            icon="play-circle"
            style={{}}
            size={50}
            onPress={onPressPlay}
          />
        </View>
      )}
    </LoadingContainer>
  )
}

const s = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    position: 'relative',
  },
  loading: {
    zIndex: 1,
    height: Metrics.screen.width * 0.58,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  loadingContent: {
    flex: 1,
  },
  verticalWebVideo: {
    ...StyleSheet.absoluteFillObject,
    left: -16,
    width: VIDEO_WIDTH,
    height: '100%',
    // borderRadius: 20,
  },
  horizontalWebVideo: {
    width: VIDEO_WIDTH,
    height: (VIDEO_WIDTH * 9) / 16,
    marginBottom: 20,
  },
  control: {
    ...StyleSheet.absoluteFillObject,
    width: VIDEO_WIDTH,
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(1,1,1,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 50,
  },
})

export default WebVideo
