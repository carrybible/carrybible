import BottomButton from '@components/BottomButton'
import { H1, H3, Text, Title } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { useHandleChangeModalHeight } from '@scenes/Study/Creation/AdvancedStudy/BuilderScreen/ActivityCreationModals/utils'
import BorderTextInput from '@scenes/Study/Creation/AdvancedStudy/components/BorderTextInput'
import { Metrics } from '@shared/index'
import Styles from '@shared/Styles'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useRef, useState } from 'react'
import { Animated, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { TabView } from 'react-native-tab-view'

import TabBarDot from '../../components/TabBarDot'

type QuestionModalType = 'default-questions' | 'write-new-questions'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const QuestionModal = ({
  onCreate,
  initActivity,
}: {
  onCreate: (act: StudyPlan.QuestionAct) => void
  onDismiss: () => void
  initActivity?: StudyPlan.QuestionAct
}) => {
  const { custom } = useLayoutAnimation()
  const [question, setQuestion] = useState<StudyPlan.QuestionAct>(() => {
    if (initActivity) {
      return initActivity
    }
    return {
      type: 'question',
      question: '',
      error: '',
    }
  })
  const [questionModalType, setQuestionModalType] = useState<QuestionModalType>('default-questions')
  const [height, setHeight] = useState(414)
  const opacity = useRef(new Animated.Value(1))
  const handleChangeHeight = useHandleChangeModalHeight(setHeight)

  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string }[] = [{ key: 'intro' }, { key: 'choose-question' }]
    return {
      index: 0,
      routes,
    }
  })

  const changeOpacity = useCallback(async (toValue: number, immediate = false) => {
    return new Promise<void>(resolve => {
      if (immediate) {
        opacity.current.setValue(toValue)
        resolve()
        return
      }
      Animated.timing(opacity.current, {
        duration: 150,
        easing: Easing.linear,
        toValue,
        useNativeDriver: true,
      }).start(() => resolve())
    })
  }, [])

  // opacity to 0 -> slide -> change height + opacity to 1
  const handleIndexChange = useCallback(
    async (index: number, newQuestionModalType: QuestionModalType = questionModalType) => {
      if (navigationState.index === 0) {
        await changeOpacity(0)
      }

      setNavigationState({ ...navigationState, index })
      setQuestionModalType(newQuestionModalType)
      // Need to wait for the swipe animation of react-native-tabview to finish
      // before changing the height of modal to prevent conflict in animation
      await wait(500)

      custom()
      if (index === 0) {
        handleChangeHeight(414)
      } else if (newQuestionModalType === 'default-questions') {
        handleChangeHeight(520)
      } else {
        handleChangeHeight(299)
      }
      await changeOpacity(1)
    },
    [changeOpacity, custom, handleChangeHeight, navigationState, questionModalType],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'intro': {
        return (
          <Intro
            onChooseQuestion={() => {
              return handleIndexChange(1, 'default-questions')
            }}
            onWriteQuestion={() => {
              return handleIndexChange(1, 'write-new-questions')
            }}
            opacity={opacity.current}
          />
        )
      }
      case 'choose-question': {
        return (
          <ChooseQuestions
            type={questionModalType}
            opacity={opacity.current}
            question={question.question}
            setQuestion={newQuestion => setQuestion({ ...question, question: newQuestion })}
            onPressDone={() => onCreate(question)}
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
        onSwipeStart={async () => {
          await changeOpacity(0, true)
        }}
        initialLayout={INITIAL_LAYOUT}
        swipeEnabled={navigationState.index > 0}
        lazy
      />
    </Animated.View>
  )
}

const Intro = ({
  onChooseQuestion,
  onWriteQuestion,
  opacity,
}: {
  onChooseQuestion: () => void
  onWriteQuestion: () => void
  opacity: Animated.Value
}) => {
  return (
    <View style={styles.flex}>
      <Animated.View style={[styles.introContent, { opacity }]}>
        <Title style={styles.iconIntro}>💬</Title>
        <H1>{I18n.t('text.Add a question')}</H1>
        <Text>{I18n.t('text.add_question_description')}</Text>
      </Animated.View>

      <BottomButton title={I18n.t('text.Choose a question')} rounded onPress={onChooseQuestion} />
      <BottomButton title={I18n.t('text.Write my own question')} rounded secondary onPress={onWriteQuestion} />
    </View>
  )
}

const ChooseQuestions = ({
  type,
  opacity,
  question,
  setQuestion,
  onPressDone,
}: {
  type: QuestionModalType
  opacity: Animated.Value
  question?: string
  setQuestion: (newQuestion: string) => void
  onPressDone: () => void
}) => {
  return (
    <View style={styles.flex}>
      <H1 align="center" style={styles.titleChooseQuestion}>
        {type === 'default-questions' ? I18n.t('text.Choose a question') : I18n.t('text.Write a question')}
      </H1>
      <Animated.View style={[styles.flex, { opacity }]}>
        {type === 'default-questions' ? (
          <DefaultQuestions selectedQuestion={question} setQuestion={setQuestion} />
        ) : (
          <WriteQuestion selectedQuestion={question} setQuestion={setQuestion} />
        )}
      </Animated.View>
      <BottomButton title={I18n.t('text.Done')} rounded onPress={onPressDone} disabled={(question || '').length === 0} />
    </View>
  )
}

const DEFAULT_QUESTION_LIST = [
  'What passage stood out to you? 📖',
  'What did you learn about God’s character? ⚡️',
  'How can you apply this to your life? ',
  'Who can you share this with? 🗣',
]
const DefaultQuestions = ({ selectedQuestion, setQuestion }: { selectedQuestion?: string; setQuestion: (newQuestion: string) => void }) => {
  const { color } = useTheme()
  return (
    <ScrollView style={styles.defaultQuestionWrapper}>
      {DEFAULT_QUESTION_LIST.map(question => {
        return (
          <TouchableOpacity
            key={question}
            onPress={() => setQuestion(question)}
            style={[
              styles.defaultQuestionItem,
              color.id === 'light' ? Styles.shadow : Styles.shadowDark,
              {
                backgroundColor: color.background,
                borderColor: color.background,
              },
              selectedQuestion === question
                ? {
                    borderColor: color.accent,
                  }
                : null,
            ]}
          >
            <Text>{question}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const WriteQuestion = ({ selectedQuestion, setQuestion }: { selectedQuestion?: string; setQuestion: (newQuestion: string) => void }) => {
  return (
    <View style={styles.writeQuestionWrapper}>
      <H3 bold={false} color="gray3" align="center">
        {I18n.t('text.Enter a question for your group below')}
      </H3>
      <BorderTextInput
        maxLength={150}
        numberOfLines={1}
        value={selectedQuestion}
        onChangeText={t => setQuestion(t)}
        placeholder={I18n.t('text.Write your own question here')}
      />
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
  titleChooseQuestion: {
    marginVertical: 30,
  },
  defaultQuestionWrapper: { marginBottom: 10 },
  defaultQuestionItem: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  writeQuestionWrapper: { paddingHorizontal: 16 },
})

export default QuestionModal
