/**
 * Config Setting for Goal
 *
 * @format
 *
 */

import ChapterReadRatePicker from '@components/ChapterReadRatePicker'
import Container from '@components/Container'
import DatePicker from '@components/DatePicker'
import HeaderBar from '@components/HeaderBar'
import { Footnote, H1, Subheading, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { createQuickStudy } from '@shared/Firestore/study'
import { Constants, LocalStorage, Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useRef, useState } from 'react'
import { FlatList, Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import CustomQuestion from './components/CustomQuestion'
import SettingItem from './components/SettingItem'

interface Props {
  navigation: any
  route: any
}

const FREE_ITEM = { key: 'passage', question: I18n.t('question.What passage stood out to you'), type: 'default' }

const SettingsGoal: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const Analytics = useAnalytic()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)
  const { from, to, chapters, book } = props.route.params
  const [data, setData] = useState<any>([])
  const isStarting = useRef<boolean>(false)
  const { showLoading, hideLoading } = useLoading()
  const me = useSelector<RootState, App.User>(state => state.me)
  const [pickedQuestion, setPickedQuestion] = useState<any>(['passage', 'god'])
  const [readRate, setReadRate] = useState<any>({ count: 1, rate: 'day' })
  const [isVisible, setVisible] = useState(false)
  const [datePicker, setDatePicker] = useState({
    isVisible: false,
    value: new Date(),
  })
  const { color: theme } = useTheme()

  useEffect(() => {
    getCustomQuestion()
  }, [])

  const getCustomQuestion = async () => {
    const questions = await LocalStorage.getData(LocalStorage.keys.SUGGEST_QUESTIONS)
    setData([
      { key: 'god', question: I18n.t('question.What one thing did you learn about Gods character'), type: 'default' },
      { key: 'apply', question: I18n.t('question.How can you apply this to your life'), type: 'default' },
      { key: 'share', question: I18n.t('question.Who can you share this with'), type: 'default' },
      { key: 'verse', question: I18n.t('question.What 1 verse popped'), type: 'default' },
      { key: 'jesus', question: I18n.t('question.What does this say about God or Jesus'), type: 'default' },
      { key: 'people', question: I18n.t('question.What does this say about people'), type: 'default' },
      { key: 'speak', question: I18n.t('question.How does this story speak to you personally'), type: 'default' },
      { key: 'read', question: I18n.t('question.How are you moved to action from what you have read'), type: 'default' },
      ...(questions && Array.isArray(questions) ? questions : []),
    ])
  }

  async function handleCreateGoal(start) {
    if (!start) {
      setDatePicker({
        isVisible: true,
        value: new Date(),
      })
      return
    }
    isStarting.current = true
    showLoading()

    // Handle cache custom question
    let newCustomQuestion: Array<any> = []
    const temporaryQuestion: Array<any> = []
    const questionsData = [FREE_ITEM, ...data]
      .filter((item, index) => {
        const isChoosen = pickedQuestion.includes(item.key)
        if (item?.type !== 'default') {
          if (newCustomQuestion.length < 4) {
            if (isChoosen) {
              newCustomQuestion.push({ ...item, key: `Save${index}` })
            } else {
              temporaryQuestion.push({ ...item, key: `Save${index}` })
            }
          }
        }
        return isChoosen
      })
      .map(item => item.question)
    if (newCustomQuestion.length < 4) {
      newCustomQuestion = [...newCustomQuestion, ...temporaryQuestion].slice(0, 3)
    }
    LocalStorage.storeData(LocalStorage.keys.SUGGEST_QUESTIONS, newCustomQuestion)
    // ---------------------------

    const startTime = start
    Keyboard.dismiss()
    showLoading()
    const quickStudyPlan = {
      name: `${book.name} ${from.id}-${to.id}`,
      bookId: from.bookId,
      bookName: book.name,
      bookAbbr: book.abbr,
      fromChapterId: from.id,
      toChapterId: to.id,
      totalChapter: to.id - from.id + 1,
      chapterPerPace: readRate.count,
      pace: readRate.rate,
      questions: questionsData,
      startDate: startTime,
      status: 'normal',
    }

    if (!me.uid && !me.streamToken) {
      dispatch({ type: TYPES.ONBOARDING.SET_QUICK_STUDY_PLAN, quickStudyPlan })
      NavigationRoot.navigate(Constants.SCENES.ONBOARDING.LOGIN, {
        isCreateGroup: true,
        groupInfo: {
          id: onboarding.groupId,
          name: onboarding.groupName,
          avatar: onboarding.groupAvatar?.url,
          members: [],
        },
      })

      hideLoading()
      return
    }

    const result = await createQuickStudy(group.id, quickStudyPlan)
    if (result) {
      Analytics.event(Constants.EVENTS.GROUP.CREATE_GOAL_SUCCESS)
      toast.success(I18n.t('text.Goal is created'))
      hideLoading()
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: group.id })
      props.navigation.popToTop()
      props.navigation.navigate(Constants.SCENES.GROUP_HOME, { groupId: group.id })
    } else {
      toast.error(I18n.t('error.Create goal fail'))
      hideLoading()
    }
    setTimeout(() => {
      // when active button again too fast, user can tap again, need some delay
      isStarting.current = false
    }, 1000)
  }

  const onChangePickedQuestion = (picked: Array<string>) => {
    if (picked.length > 0) setPickedQuestion(picked)
  }

  const renderItem = ({ item, drag, index }) => {
    return (
      <>
        <SettingItem
          disabled={false}
          item={item}
          drag={drag}
          pickedQuestion={pickedQuestion}
          onChangePickedQuestion={onChangePickedQuestion}
        />
      </>
    )
  }

  const submitCustomQuestion = t => {
    if (t.length > 5) {
      setData(data => [{ key: `${data.length}`, question: t }, ...data])
      if (pickedQuestion.length < 5) {
        setPickedQuestion(value => [`${data.length}`, ...value])
      }
      // setCustomText('')
      Keyboard.dismiss()
    } else {
      Keyboard.dismiss()
      toast.error(I18n.t('error.The question is too short'))
    }
  }

  const separator = () => <View style={s.separator} />

  const showPickerRate = () => {
    setVisible(true)
  }

  const dismissPickerRate = value => {
    if (value) {
      setReadRate(value)
    }
    setVisible(false)
  }

  const dismissDatePicker = value => {
    setDatePicker({
      isVisible: false,
      value: value,
    })
    if (value) {
      handleCreateGoal(value)
    }
  }

  return (
    <>
      <Container safe forceInset={{ bottom: true, top: false }}>
        <View style={[s.blueBg, { backgroundColor: theme.accent }]} />
        <HeaderBar
          iconLeft="chevron-left"
          iconLeftSize={28}
          colorLeft={theme.white}
          onPressLeft={() => {
            props.navigation.pop()
          }}
          style={{ marginTop: Metrics.header.height }}
          textRight={I18n.t('text.Start')}
          colorRight={theme.white}
          onPressRight={() => {
            if (!isStarting.current) {
              handleCreateGoal(null)
            } else {
              devWarn('ACTION BLOCKED!')
            }
          }}
        />

        <View style={s.title_container}>
          <H1 bold color="white">
            {I18n.t('text.The final step')}
          </H1>
          <Text color="white" style={s.dailyQuestionText}>
            {I18n.t('text.Choose your daily questions')}
          </Text>
        </View>

        <View style={s.flex1}>
          <FlatList
            ListHeaderComponent={() => {
              return (
                <>
                  <View style={[s.chapterContainer, { backgroundColor: theme.background }]}>
                    <Text bold style={s.chapterText}>
                      {I18n.t(`bible.${book?.name}`)}
                    </Text>
                  </View>
                  <Subheading color={'gray'} style={s.titleText}>
                    {I18n.t('text.Reading pace')}
                  </Subheading>
                  <TouchableOpacity
                    style={[s.frequencyText, { backgroundColor: theme.background, borderColor: `${theme.text}55` }]}
                    onPress={showPickerRate}>
                    <Text bold>
                      {I18n.t('params.chapter', { countChapter: readRate.count, pluralS: readRate.count > 1 ? 's' : '' })}{' '}
                      <Footnote color="gray">{I18n.t('text.per')} </Footnote>
                      {I18n.t(`${readRate.rate}`)}
                    </Text>
                  </TouchableOpacity>
                  <Subheading color={'gray'} style={s.titleText}>
                    {I18n.t('text.We will be discussing these questions')}
                  </Subheading>
                  <CustomQuestion editable onSubmit={t => submitCustomQuestion(t)} />
                </>
              )
            }}
            style={s.list}
            data={[...[FREE_ITEM], ...data]}
            renderItem={renderItem}
            keyExtractor={(item, index) => `draggable-item-${item.key}`}
            ItemSeparatorComponent={separator}
            ListFooterComponent={separator}
          />
        </View>
      </Container>
      <ChapterReadRatePicker
        isVisible={isVisible}
        handleDismiss={dismissPickerRate}
        current={readRate}
        totalChapter={chapters?.length ? (chapters.length > 5 ? 5 : chapters?.length) : 0}
      />
      <DatePicker
        isVisible={datePicker.isVisible}
        handleDismiss={dismissDatePicker}
        current={datePicker.value}
        title={I18n.t('text.Choose a start date')}
        confirm={I18n.t('text.Confirm')}
        minimumDate={new Date()}
      />
    </>
  )
}

const s = StyleSheet.create({
  blueBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  title_container: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    height: 50,
  },
  titleText: {
    marginVertical: 15,
    alignSelf: 'center',
  },
  chapterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    height: 50,
    ...Styles.shadow2,
  },
  chapterText: {
    flex: 1,
    textAlign: 'center',
  },
  separator: {
    height: 15,
  },
  flex1: {
    flex: 1,
  },
  list: {
    width: '100%',
  },
  dailyQuestionText: {
    opacity: 0.7,
  },
})

export default SettingsGoal
