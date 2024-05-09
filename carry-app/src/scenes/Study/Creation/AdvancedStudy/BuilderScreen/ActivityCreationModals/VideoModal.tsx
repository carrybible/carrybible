import BottomButton from '@components/BottomButton'
import { H1, Text, Title } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import { useHandleChangeModalHeight } from '@scenes/Study/Creation/AdvancedStudy/BuilderScreen/ActivityCreationModals/utils'
import { Metrics } from '@shared/index'
import Utils, { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useState } from 'react'
import { Animated, Easing, Image, StyleSheet, View } from 'react-native'
import { TabView } from 'react-native-tab-view'

import BorderTextInput from '../../components/BorderTextInput'
import TabBarDot from '../../components/TabBarDot'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const VideoModal = ({
  onCreate,
  initActivity,
}: {
  onCreate: (act: StudyPlan.VideoAct) => void
  onDismiss: () => void
  initActivity?: StudyPlan.VideoAct
}) => {
  const { custom } = useLayoutAnimation()
  const [video, setVideo] = useState<StudyPlan.VideoAct>(() => {
    if (initActivity) {
      return initActivity
    }
    return {
      type: 'video',
      service: 'youtube',
      videoId: '',
      title: '',
      description: '',
      duration: 0,
      error: '',
    }
  })
  const [height, setHeight] = useState(600)
  const handleChangeHeight = useHandleChangeModalHeight(setHeight)
  const changeOpacity = useCallback(async (animatedValue: Animated.Value, toValue: number, immediate = false) => {
    return new Promise<void>(resolve => {
      if (immediate) {
        animatedValue.setValue(toValue)
        resolve()
        return
      }
      Animated.timing(animatedValue, {
        duration: 150,
        easing: Easing.linear,
        toValue,
        useNativeDriver: true,
      }).start(() => resolve())
    })
  }, [])

  const [navigationState, setNavigationState] = useState(() => {
    const routes: { key: string; height: number; index: number; opacity: Animated.Value }[] = [
      {
        index: 0,
        key: 'intro',
        height: 600,
        opacity: new Animated.Value(1),
      },
      {
        index: 1,
        key: 'video-link',
        height: 414,
        opacity: new Animated.Value(0),
      },
      {
        index: 2,
        key: 'video-title',
        height: 360,
        opacity: new Animated.Value(0),
      },
      {
        index: 3,
        key: 'video-description',
        height: 414,
        opacity: new Animated.Value(0),
      },
    ]
    return {
      index: 0,
      routes,
    }
  })

  const handleIndexChange = useCallback(
    async (index: number) => {
      await changeOpacity(navigationState.routes[navigationState.index].opacity, 0)
      setNavigationState({ ...navigationState, index })
      // Need to wait for the swipe animation of react-native-tabview to finish
      // before changing the height of modal to prevent conflict in animation
      await wait(500)

      custom()
      handleChangeHeight(navigationState.routes[index].height)
      await changeOpacity(navigationState.routes[index].opacity, 1)
    },
    [changeOpacity, custom, navigationState],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'intro': {
        return <Intro onPressNext={() => handleIndexChange(route.index + 1)} opacity={route.opacity} />
      }
      case 'video-link': {
        return (
          <VideoLink
            onPressNext={() => handleIndexChange(route.index + 1)}
            opacity={route.opacity}
            videoId={video.videoId}
            setVideoId={(videoId: string) =>
              setVideo({
                ...video,
                videoId,
              })
            }
          />
        )
      }
      case 'video-title': {
        return (
          <VideoTitle
            onPressNext={() => handleIndexChange(route.index + 1)}
            opacity={route.opacity}
            title={video.title}
            setTitle={(newTitle: string) => {
              setVideo({
                ...video,
                title: newTitle,
              })
            }}
          />
        )
      }
      case 'video-description': {
        return (
          <VideoDescription
            onPressDone={() => onCreate(video)}
            opacity={route.opacity}
            description={video.description}
            setDescription={(newDescription: string) => {
              setVideo({
                ...video,
                description: newDescription,
              })
            }}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <Animated.View style={{ height }}>
      <TabView
        navigationState={navigationState}
        renderScene={renderScene}
        renderTabBar={props => <TabBarDot {...props} />}
        tabBarPosition={'bottom'}
        onIndexChange={handleIndexChange}
        initialLayout={INITIAL_LAYOUT}
        swipeEnabled={false}
      />
    </Animated.View>
  )
}

const Intro = ({ onPressNext, opacity }: { onPressNext: () => void; opacity: Animated.Value }) => {
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.introContent, { opacity }]}>
        <Title style={styles.iconIntro}>🎥</Title>
        <H1>{I18n.t('text.Add video content')}</H1>
        <Image source={require('@assets/images/img-video-description.png')} style={styles.introImage} />
        <Text>{I18n.t('text.add_video_description')}</Text>
      </Animated.View>

      <BottomButton title={I18n.t('text.Next')} rounded onPress={onPressNext} />
    </View>
  )
}

const VideoLink = ({
  onPressNext,
  opacity,
  videoId,
  setVideoId,
}: {
  onPressNext: () => void
  opacity: Animated.Value
  videoId?: string
  setVideoId: (string) => void
}) => {
  const [videoLink, setVideoLink] = useState(videoId ? `https://youtu.be/${videoId}` : '')
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.wrapper, { opacity }]}>
        <View style={styles.videoDescription}>
          <H1>{I18n.t('text.Paste video link')}</H1>
          <Text>{I18n.t('text.paste_video_link_description')}</Text>
        </View>
        <View style={styles.singleInput}>
          <BorderTextInput placeholder={I18n.t('text.Enter video link here')} value={videoLink} onChangeText={setVideoLink} />
        </View>
      </Animated.View>
      <BottomButton
        title={I18n.t('text.Next')}
        rounded
        onPress={() => {
          const videoId = Utils.getYoutubeVideoId(videoLink)
          if (!videoId) {
            toast.error(I18n.t('text.Youtube url is not correct please check again'))
            return
          }
          setVideoId(videoId)
          onPressNext()
        }}
        avoidKeyboard={false}
        disabled={videoLink.length === 0}
      />
    </View>
  )
}

const VideoTitle = ({
  onPressNext,
  opacity,
  title,
  setTitle,
}: {
  onPressNext: () => void
  opacity: Animated.Value
  title: string
  setTitle: (string) => void
}) => {
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.wrapper, { opacity }]}>
        <View style={styles.videoDescription}>
          <H1>{I18n.t('text.Title your video')}</H1>
          <Text align="center">{I18n.t('text.Enter a title for the video you chose below')}</Text>
        </View>
        <View style={styles.singleInput}>
          <BorderTextInput placeholder={I18n.t('text.Enter video title here')} value={title} onChangeText={setTitle} />
        </View>
      </Animated.View>
      <BottomButton title={I18n.t('text.Next')} rounded onPress={onPressNext} avoidKeyboard={false} disabled={title.length === 0} />
    </View>
  )
}

const VideoDescription = ({
  onPressDone,
  opacity,
  description,
  setDescription,
}: {
  onPressDone: () => void
  opacity: Animated.Value
  description: string
  setDescription: (string) => void
}) => {
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.wrapper, { opacity }]}>
        <View style={styles.descriptionWrapper}>
          <H1 style={styles.descriptionTitle}>{I18n.t('text.Add a description')}</H1>
          <Text>{I18n.t('text.video_add_description')}</Text>
        </View>
        <View style={styles.multilineInput}>
          <BorderTextInput
            placeholder={I18n.t('text.Write description here')}
            value={description}
            onChangeText={setDescription}
            multiline={true}
            maxLength={500}
            style={styles.biggerTextInput}
          />
        </View>
      </Animated.View>
      <BottomButton title={I18n.t('text.Done')} rounded onPress={onPressDone} avoidKeyboard={false} disabled={description.length === 0} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  introContent: {
    flex: 1,
    alignItems: 'center',
    margin: 30,
    justifyContent: 'space-around',
  },
  iconIntro: {
    fontSize: 36,
  },
  introImage: {
    marginVertical: 20,
  },
  wrapper: {
    marginVertical: 30,
    flex: 1,
    alignItems: 'center',
  },
  singleInput: {
    width: '100%',
    paddingHorizontal: 15,
  },
  videoDescription: {
    alignItems: 'center',
    marginHorizontal: 30,
    flex: 1,
    justifyContent: 'space-around',
  },
  descriptionWrapper: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  multilineInput: {
    flex: 1,
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 15,
  },
  descriptionTitle: {
    marginBottom: 30,
  },
  biggerTextInput: {
    height: '100%',
    paddingTop: 10,
  },
})

export default VideoModal
