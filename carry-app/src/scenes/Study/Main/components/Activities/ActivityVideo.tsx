import Loading from '@components/Loading'
import { H1, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import IconButton from '@scenes/Onboarding/components/IconButton'
import Metrics from '@shared/Metrics'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Video from 'react-native-video'
import YoutubePlayer from 'react-native-youtube-iframe'
import AnimatedProgressButton from '../AnimatedProgressButton'
import VideoPlayer from './VideoPlayer'

interface Props {
  onWatched?: () => void
  shouldHideVideo: boolean
  video?: StudyPlan.VideoAct
}

const LoadingContainer: React.FC<{
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

const VIDEO_WIDTH = Metrics.screen.width - 32
const WebVideo = ({ r, video, shouldHideVideo }: { r: any; video: StudyPlan.VideoAct; shouldHideVideo: boolean }) => {
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
            ref={videoRef => {
              ref.current = videoRef
              r.current = videoRef
            }}
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
        <View style={s.control}>
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

const ActivityVideo: FC<Props> = ({ onWatched, video, shouldHideVideo }) => {
  const progressButton = useRef<AnimatedProgressButton | null>(null)
  const { color } = useTheme()
  if (!video) return null
  const { vertical } = video

  const onPressDone = () => {
    onWatched?.()
  }

  return (
    <>
      <View
        style={[
          {
            backgroundColor: color.id === 'light' ? color.white : color.black,
          },
          s.container,
        ]}>
        {vertical && <VideoPlayer video={video} shouldHideVideo={shouldHideVideo} />}

        {!vertical && (
          <ScrollView showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
            <H1 style={s.title}>{video?.title}</H1>
            <YoutubeVideo video={video} />
            <VideoPlayer video={video} shouldHideVideo={shouldHideVideo} />
            <Text>{video.description}</Text>
          </ScrollView>
        )}
      </View>
      <AnimatedProgressButton
        ref={progressButton}
        text={I18n.t('text.Mark as watched')}
        onPress={onPressDone}
        initialEnabled={true}
        style={{ marginBottom: Metrics.insets.bottom }}
        color={color}
      />
    </>
  )
}

const YoutubeVideo = ({ video }: { video: StudyPlan.VideoAct }) => {
  const [videoReady, setVideoReady] = useState(false)
  const [playing, setPlaying] = useState(false)

  const onStateChange = useCallback(state => {
    if (state === 'ended') {
      setPlaying(false)
    }
  }, [])

  if (video.service !== 'youtube' || !video.videoId) {
    return null
  }

  return (
    <LoadingContainer isReady={videoReady}>
      <YoutubePlayer
        height={Metrics.screen.width * 0.58}
        play={playing}
        videoId={video.videoId}
        onChangeState={onStateChange}
        onReady={async () => {
          await wait(250)
          setVideoReady(true)
        }}
      />
    </LoadingContainer>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Metrics.insets.horizontal,
    marginBottom: Metrics.insets.horizontal,
    borderRadius: 20,
  },
  title: { marginBottom: 30, marginTop: 60 },
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
    borderRadius: 20,
  },
  horizontalWebVideo: {
    width: VIDEO_WIDTH,
    height: (VIDEO_WIDTH * 9) / 16,
    marginBottom: 20,
  },
  control: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    left: 0,
    right: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(1,1,1,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
})

export default ActivityVideo
