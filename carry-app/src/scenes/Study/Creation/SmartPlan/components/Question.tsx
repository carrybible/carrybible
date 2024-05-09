/**
 * Onboarding Describe Yourself
 *
 * @format
 *
 */

import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, Platform } from 'react-native'

import { H1, Text } from '@components/Typography'
import { Metrics, Styles, Constants } from '@shared/index'
import I18n from 'i18n-js'
import NicelyDone from '../../components/NicelyDone'
import useTheme from '@hooks/useTheme'

interface Props {
  onPressContinue: (a: string, b: number, c: string) => void
  initValue?: string | undefined
  questionIndex: number
  currentIndex?: number
}

interface Question {
  title: string
  des: string
  index?: number
  questionKey: string
  result?: string
}

const questions = [
  {
    title: I18n.t('text.Why are you creating group'),
    options: [
      {
        title: '⛪️',
        des: I18n.t('text.Creating small groups for members of my church or ministry'),
        result: 'Great for small groups',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_FORMAL_GROUP,
      },
      {
        title: '🎓',
        des: I18n.t('text.Building communities for college campus students'),
        result: 'Designed for college students',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_COLLEGE_CAMPUS,
      },
      {
        title: '⛏',
        des: I18n.t('text.Going deeper with my friends'),
        result: 'Perfect for going deeper',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_DEEPER_FRIENDS,
      },
      {
        title: '✨',
        des: I18n.t('text.Just trying it out'),
        result: 'Flexible plan for all groups',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_TRYING_OUT,
      },
    ],
  },
  {
    title: I18n.t('text.Who is your group made up of'),
    options: [
      {
        title: '📖',
        des: I18n.t('text.Long-term believers going deeper'),
        result: 'In-depth study for long-term believers',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_LONG_TERM,
      },
      {
        title: '💡',
        des: I18n.t('text.New believers or non-believers'),
        result: 'Fundamentals for new believers',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_NEW_BELIEVERS,
      },
      {
        title: '👟',
        des: I18n.t('text.Somewhere in between'),
        result: 'Great for all faith journeys',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_MIXED_GROUP,
      },
    ],
  },
  {
    title: I18n.t('text.How much time does your group have to study each day'),
    options: [
      {
        title: '🌱',
        des: I18n.t('text.5 minutes'),
        result: 'Just 5 mins daily',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_5_MINS,
      },
      {
        title: '🌿',
        des: I18n.t('text.10 minutes'),
        result: 'Approximately 10 mins daily',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_10_MINS,
      },
      {
        title: '🌳',
        des: I18n.t('text.more 15 minutes'),
        result: 'About 15 mins daily',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_15_MINS,
      },
    ],
  },
  {
    title: I18n.t('text.When do you want to start'),
    options: [
      {
        title: '☀️',
        des: I18n.t('text.Start study plan today '),
        result: 'today',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_START_STUDY_TODAY,
      },
      {
        title: '🌙',
        des: I18n.t('text.Choose a future date'),
        result: 'future',
        questionKey: Constants.SMART_PLAN_ANSWERS_KEYS.ANSWER_CHOOSE_A_FUTURE_DATE,
      },
    ],
  },
]

const Question: React.FC<Props> = props => {
  const [choosenItem, chooseItem] = useState<string | undefined>()
  const question = questions[props.questionIndex]
  const [showNicelyDone, setShowNicelyDone] = useState<boolean>(false)

  useEffect(() => {
    if (props.initValue && !choosenItem) {
      chooseItem(props.initValue)
    }
  }, [props.initValue, choosenItem])

  useEffect(() => {
    toggleNicelyDone()
  }, [props.currentIndex])

  const toggleNicelyDone = () => {
    if (props.currentIndex === 1 || props.currentIndex === 2) {
      setShowNicelyDone(false)
      setTimeout(() => setShowNicelyDone(true), 300)
    }
  }

  const onPressItem = (key, result) => {
    props.onPressContinue(key, props.questionIndex, result)
  }

  return (
    <View style={s.container}>
      <View>
        <H1 style={s.title}>{question.title}</H1>
        {question.options.map((value: Question, index: number) => (
          <ButtonOption key={value.questionKey} {...value} index={index} onPressItem={onPressItem} />
        ))}
      </View>
      <View style={s.nicedone}>
        {props.questionIndex === 1 && showNicelyDone ? (
          <NicelyDone content={I18n.t('text.This will help us create studies perfect for your group')} />
        ) : null}
        {props.questionIndex === 2 && showNicelyDone ? (
          <NicelyDone content={I18n.t('text.We will make sure to take it easy on the weekends')} />
        ) : null}
      </View>
    </View>
  )
}

Question.defaultProps = {}

const ButtonOption = (props: Question & { onPressItem: (key: string, result?: string) => void }) => {
  const { color } = useTheme()
  const { title, des, questionKey, result } = props

  return (
    <View style={[Styles.shadow2, s.btn]}>
      <Pressable
        style={({ pressed }) => [
          s.itemContainer,
          {
            backgroundColor: color.background,
          },
          color.id === 'light' ? Styles.shadow : s.darkThemeShadow,
          pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : null,
        ]}
        android_ripple={{
          color: color.gray7,
        }}
        onPress={() => {
          props.onPressItem(questionKey, result)
        }}
      >
        <Text style={s.titleBtn}>{title}</Text>
        <Text style={s.des}>{des}</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    height: 60,
    flexDirection: 'row',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  nicedone: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  title: { marginBottom: 70 },
  des: { marginLeft: 16, flexWrap: 'wrap', flex: 1 },
  titleBtn: { fontSize: 30 },
  btn: { paddingHorizontal: 2 },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
})

export default Question
