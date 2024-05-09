import Icon from '@components/Icon'
import ProgressBar from '@components/ProgressBar'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Metrics from '@shared/Metrics'
import _ from 'lodash'
import * as React from 'react'
import { Platform, StyleProp, StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native'
import { TabView } from 'react-native-tab-view'
import { useDispatch } from 'react-redux'
import DatePicker from '@components/DatePicker'
import I18n from 'i18n-js'
import Question from './Question'

const routes = [
  { key: Constants.SMART_PLAN_QUESTION_KEYS.PURPOSE, title: 'Why are you creating group' },
  { key: Constants.SMART_PLAN_QUESTION_KEYS.CONSTITUTION, title: 'Who is your group made up of' },
  { key: Constants.SMART_PLAN_QUESTION_KEYS.TIME, title: 'How much time does your group have to study each day' },
  { key: Constants.SMART_PLAN_QUESTION_KEYS.START_DATE, title: 'How much time does your group have to study each day' },
]

const Questions: React.FC<{
  style?: StyleProp<ViewStyle>
  onComplete: () => void
}> = ({ style, onComplete }) => {
  const [process, setProcess] = React.useState(30)
  const [tabState, setTabState] = React.useState({
    index: 0,
    routes,
  })
  const [datePicker, setDatePicker] = React.useState({
    isVisible: false,
    value: new Date(),
  })
  const dispatch = useDispatch()
  const { linear } = useLayoutAnimation()
  const dim = useWindowDimensions()
  const { color } = useTheme()

  const onIndexChange = (index: number) => {
    setTabState({ ...tabState, index })
  }

  const progressTo = (key: string, index: number) => {
    const idx = _.findIndex(tabState.routes, { key: key })
    setProcess(((index + 2) / 4) * 100)
    if (Platform.OS === 'ios') {
      linear()
    }
    setTabState({ ...tabState, index: idx })
  }

  const onAnswers = (answer: string, questionIndex: number, result: string) => {
    dispatch({
      type: TYPES.ONBOARDING.SET_ANSWERS,
      response: { questionID: routes[questionIndex].key, answerID: answer, result },
      index: questionIndex,
    })
  }

  const onPressBack = () => {
    if (tabState.index > 0) {
      setTabState({
        ...tabState,
        index: tabState.index - 1,
      })
      setProcess((tabState.index / 4) * 100)
    } else {
      NavigationRoot.pop()
    }
  }

  const onLastQuestion = (key, questionIndex, result) => {
    if (result === 'future') {
      setDatePicker({
        isVisible: true,
        value: new Date(),
      })
    }
    if (result === 'today') {
      dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: new Date() })
      setProcess(100)
      linear()
      onComplete()
    }
  }

  const dismissDatePicker = value => {
    setDatePicker({
      isVisible: false,
      value: value,
    })
    if (value) {
      dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: value })
      setProcess(100)
      linear()
      onComplete()
    }
  }

  const renderScene = ({ route }) => {
    switch (route.key) {
      case Constants.SMART_PLAN_QUESTION_KEYS.PURPOSE:
        return (
          <Question
            key={route.key}
            questionIndex={0}
            onPressContinue={(key, questionIndex, result) => {
              progressTo(Constants.SMART_PLAN_QUESTION_KEYS.CONSTITUTION, 0)
              onAnswers(key, questionIndex, result)
            }}
          />
        )
      case Constants.SMART_PLAN_QUESTION_KEYS.CONSTITUTION:
        return (
          <Question
            key={route.key}
            questionIndex={1}
            currentIndex={tabState.index}
            onPressContinue={(key, questionIndex, result) => {
              progressTo(Constants.SMART_PLAN_QUESTION_KEYS.TIME, 1)
              onAnswers(key, questionIndex, result)
            }}
          />
        )
      case Constants.SMART_PLAN_QUESTION_KEYS.TIME:
        return (
          <Question
            key={route.key}
            questionIndex={2}
            currentIndex={tabState.index}
            onPressContinue={(key, questionIndex, result) => {
              progressTo(Constants.SMART_PLAN_QUESTION_KEYS.START_DATE, 2)
              onAnswers(key, questionIndex, result)
            }}
          />
        )
      case Constants.SMART_PLAN_QUESTION_KEYS.START_DATE:
        return <Question key={route.key} questionIndex={3} currentIndex={tabState.index} onPressContinue={onLastQuestion} />
      default:
        return null
    }
  }

  return (
    <View style={[s.container, style]}>
      <View style={s.progressContainer}>
        <TouchableOpacity onPress={onPressBack}>
          <Icon source="arrow-left" color={color.text} size={28} />
        </TouchableOpacity>
        <ProgressBar shining value={process} width="100%" style={s.progress} />
      </View>

      <TabView
        navigationState={tabState}
        renderTabBar={props => null}
        renderScene={renderScene}
        onIndexChange={onIndexChange}
        lazy={false}
        initialLayout={{ width: dim.width }}
        swipeEnabled={false}
      />
      <DatePicker
        isVisible={datePicker.isVisible}
        handleDismiss={dismissDatePicker}
        current={datePicker.value}
        title={I18n.t('text.Choose a start date')}
        confirm={I18n.t('text.Confirm')}
        minimumDate={new Date()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Metrics.insets.horizontal,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progress: { backgroundColor: '#CDDBFF', height: 21, marginLeft: 16, flex: 1 },
})

export default Questions
