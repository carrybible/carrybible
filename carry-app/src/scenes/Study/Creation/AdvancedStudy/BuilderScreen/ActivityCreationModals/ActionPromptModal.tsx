import BottomButton from '@components/BottomButton'
import { H1, H3, Text, Title } from '@components/Typography'
import { GroupActionsType } from '@dts/groupAction'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { useHandleChangeModalHeight } from '@scenes/Study/Creation/AdvancedStudy/BuilderScreen/ActivityCreationModals/utils'
import BorderTextInput from '@scenes/Study/Creation/AdvancedStudy/components/BorderTextInput'
import { Metrics } from '@shared/index'
import Styles from '@shared/Styles'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useState } from 'react'
import { Animated, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { TabView } from 'react-native-tab-view'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const ActionPromptModal = ({
  onCreate,
  initActivity,
  actionType,
}: {
  onCreate: (act: StudyPlan.ActionAct) => void
  onDismiss: () => void
  initActivity?: StudyPlan.ActionAct
  actionType: GroupActionsType
}) => {
  const { custom } = useLayoutAnimation()
  const [actionPrompt, setActionPrompt] = useState<StudyPlan.ActionAct>(() => {
    if (initActivity) {
      return initActivity
    }
    return {
      type: 'action',
      actionType,
      text: '',
      error: '',
    }
  })
  const [height, setHeight] = useState(Math.min(640, Metrics.screen.height))
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

  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string; height: number; index: number; opacity: Animated.Value }[] = [
      {
        index: 0,
        key: 'choose-prompt',
        height: Math.min(640, Metrics.screen.height),
        opacity: new Animated.Value(1),
      },
      {
        index: 1,
        key: 'write-prompt',
        height: 300,
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

  const handleSetPrompt = useCallback(
    (newPrompt: string) =>
      setActionPrompt({
        ...actionPrompt,
        text: newPrompt,
      }),
    [actionPrompt],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'choose-prompt': {
        return (
          <ChoosePrompt
            actionType={actionType}
            onPressDone={() => onCreate(actionPrompt)}
            onPressWritePrompt={() => {
              handleSetPrompt('')
              handleIndexChange(route.index + 1)
            }}
            opacity={route.opacity}
            prompt={actionPrompt.text ?? ''}
            setPrompt={handleSetPrompt}
          />
        )
      }
      case 'write-prompt': {
        return (
          <WritePrompt
            actionType={actionType}
            onPressDone={() => onCreate(actionPrompt)}
            opacity={route.opacity}
            prompt={actionPrompt.text ?? ''}
            setPrompt={handleSetPrompt}
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
        renderTabBar={() => null}
        onIndexChange={handleIndexChange}
        initialLayout={INITIAL_LAYOUT}
        swipeEnabled={false}
        lazy
      />
    </Animated.View>
  )
}

const useText = (actionType: GroupActionsType) => {
  if (actionType === 'prayer') {
    return {
      icon: '🙏',
      title: I18n.t('text.Add a prayer prompt'),
      description: I18n.t('text.add_prayer_description'),
      defaultPrompts: [
        I18n.t('text.What do you need prayer for today'),
        I18n.t('text.Is there someone in your life we can be praying for'),
        I18n.t('text.Is there something going on in the world you d like to pray for'),
      ],
      placeholder: I18n.t('text.Write a prayer prompt'),
    }
  }
  return {
    icon: '🎉',
    title: I18n.t('text.Add a gratitude prompt'),
    description: I18n.t('text.add_gratitude_description'),
    defaultPrompts: [
      I18n.t('text.What are you thankful to God for today'),
      I18n.t('text.Who are you thankful for this week and why'),
      I18n.t('text.Share a way God has moved in your life recently'),
    ],
    placeholder: I18n.t('text.Write a gratitude prompt'),
  }
}

const ChoosePrompt = ({
  actionType,
  onPressDone,
  onPressWritePrompt,
  prompt,
  setPrompt,
  opacity,
}: {
  actionType: GroupActionsType
  onPressDone: () => void
  onPressWritePrompt: () => void
  prompt: string
  setPrompt: (newPrompt: string) => void
  opacity: Animated.Value
}) => {
  const { color } = useTheme()
  const { icon, title, description, defaultPrompts } = useText(actionType)
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.introContent, { opacity }]}>
        <Title style={styles.iconIntro}>{icon}</Title>
        <H1 style={styles.title}>{title}</H1>
        <Text>{description}</Text>
      </Animated.View>
      <ScrollView style={styles.defaultPromptWrapper}>
        {defaultPrompts.map(defaultPrompt => {
          return (
            <TouchableOpacity
              key={defaultPrompt}
              onPress={() => setPrompt(defaultPrompt)}
              style={[
                styles.defaultPromptItem,
                color.id === 'light' ? Styles.shadow : Styles.shadowDark,
                {
                  backgroundColor: color.background,
                  borderColor: color.background,
                },
                prompt === defaultPrompt
                  ? {
                      borderColor: color.accent,
                    }
                  : null,
              ]}
            >
              <Text>{defaultPrompt}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <BottomButton title={I18n.t('text.Looks good to me ')} rounded onPress={onPressDone} disabled={!prompt} />
      <BottomButton title={I18n.t('text.Add a specific prompt')} rounded secondary onPress={onPressWritePrompt} />
    </View>
  )
}

const WritePrompt = ({
  actionType,
  onPressDone,
  prompt,
  setPrompt,
}: {
  actionType: GroupActionsType
  onPressDone: () => void
  opacity: Animated.Value
  prompt: string
  setPrompt: (newPrompt: string) => void
}) => {
  const { placeholder } = useText(actionType)
  return (
    <View style={styles.flex}>
      <H1 align="center" style={styles.titleWritePrompt}>
        {I18n.t('text.Write a prompt')}
      </H1>
      <View style={styles.writePromptWrapper}>
        <H3 bold={false} color="gray3" align="center">
          {I18n.t('text.Write a prompt for your group to answer')}
        </H3>
        <BorderTextInput maxLength={150} numberOfLines={1} value={prompt} onChangeText={setPrompt} placeholder={placeholder} />
      </View>
      <BottomButton title={I18n.t('text.Done')} rounded onPress={onPressDone} disabled={prompt.length === 0} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  introContent: {
    alignItems: 'center',
    margin: 30,
    justifyContent: 'space-around',
  },
  iconIntro: {
    fontSize: 36,
    marginBottom: 10,
  },
  titleWritePrompt: {
    marginVertical: 30,
  },
  defaultPromptWrapper: { marginBottom: 10 },
  defaultPromptItem: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  writePromptWrapper: { paddingHorizontal: 16, flex: 1 },
  title: {
    marginBottom: 10,
  },
})

export default ActionPromptModal
