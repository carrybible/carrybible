import BottomButton from '@components/BottomButton'
import { H1, Text, Title } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import { useHandleChangeModalHeight } from '@scenes/Study/Creation/AdvancedStudy/BuilderScreen/ActivityCreationModals/utils'
import { Metrics } from '@shared/index'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { TabView } from 'react-native-tab-view'

import BorderTextInput from '../../components/BorderTextInput'
import TabBarDot from '../../components/TabBarDot'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const TextModal = ({
  onCreate,
  initActivity,
}: {
  onCreate: (act: StudyPlan.TextAct) => void
  onDismiss: () => void
  initActivity?: StudyPlan.TextAct
}) => {
  const { custom } = useLayoutAnimation()
  const [text, setText] = useState<StudyPlan.TextAct>(() => {
    if (initActivity) {
      return initActivity
    }
    return {
      type: 'text',
      title: '',
      content: '',
      error: '',
    }
  })
  const [height, setHeight] = useState(414)
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
        height: 414,
        opacity: new Animated.Value(1),
      },
      {
        index: 1,
        key: 'text-title',
        height: 360,
        opacity: new Animated.Value(0),
      },
      {
        index: 3,
        key: 'text-content',
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
      case 'text-title': {
        return (
          <TextTitle
            onPressNext={() => handleIndexChange(route.index + 1)}
            opacity={route.opacity}
            title={text.title}
            setTitle={(newTitle: string) => {
              setText({
                ...text,
                title: newTitle,
              })
            }}
          />
        )
      }
      case 'text-content': {
        return (
          <TextContent
            onPressDone={() => onCreate(text)}
            opacity={route.opacity}
            content={text.content}
            setContent={(newContent: string) => {
              setText({
                ...text,
                content: newContent,
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
        <Title style={styles.iconIntro}>📝</Title>
        <H1>{I18n.t('text.Add a text entry')}</H1>
        <Text>{I18n.t('text.add_text_description')}</Text>
      </Animated.View>

      <BottomButton title={I18n.t('text.Next')} rounded onPress={onPressNext} />
    </View>
  )
}

const TextTitle = ({
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
        <View style={styles.description}>
          <H1>{I18n.t('text.Title your text entry')}</H1>
          <Text>{I18n.t('Enter a title for your text entry below ex Morning devotional')}</Text>
        </View>
        <View style={styles.singleInput}>
          <BorderTextInput placeholder={I18n.t('text.Enter text entry title here')} value={title} onChangeText={setTitle} />
        </View>
      </Animated.View>
      <BottomButton title={I18n.t('text.Next')} rounded onPress={onPressNext} avoidKeyboard={false} disabled={title.length === 0} />
    </View>
  )
}

const TextContent = ({
  onPressDone,
  opacity,
  content,
  setContent,
}: {
  onPressDone: () => void
  opacity: Animated.Value
  content: string
  setContent: (string) => void
}) => {
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.wrapper, { opacity }]}>
        <View style={styles.descriptionWrapper}>
          <H1 style={styles.descriptionTitle}>{I18n.t('text.Enter your text')}</H1>
          <Text>{I18n.t('text.Write out or paste your text entry below')}</Text>
        </View>
        <View style={styles.multilineInput}>
          <BorderTextInput
            placeholder={I18n.t('text.Add text here')}
            value={content}
            onChangeText={setContent}
            multiline={true}
            maxLength={500}
            style={styles.biggerTextInput}
          />
        </View>
      </Animated.View>
      <BottomButton title={I18n.t('text.Done')} rounded onPress={onPressDone} avoidKeyboard={false} disabled={content.length === 0} />
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
  wrapper: {
    marginVertical: 30,
    flex: 1,
    alignItems: 'center',
  },
  singleInput: {
    width: '100%',
    paddingHorizontal: 15,
  },
  description: {
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
    paddingRight: 15,
  },
})

export default TextModal
