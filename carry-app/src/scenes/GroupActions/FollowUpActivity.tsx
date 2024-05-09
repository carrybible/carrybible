import Container from '@components/Container'
import TransparentNavigation from '@components/TransparentNavigation'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { ActivityQuestion } from '@scenes/Study/Main/components/Activities'
import ReadingProgress from '@scenes/Study/Main/components/ReadingProgress'
import React, { FC, useState, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@dts/state'
import FollowUpHighlightAction from './components/Activities/FollowUpHighlightAction'
import Utils from '@shared/Utils'
import { TYPES } from '@redux/actions'

// eslint-disable-next-line no-unused-vars
const NAVIGATION_WIDTH: { [studyType in StudyPlan.Activity['type']]: { left: number; right: number } } = {
  action: { left: 32, right: 50 },
  question: { left: 32, right: 32 },
}

type ParamProps = {
  actionStepsId: string
  info: {
    id?: string
    question?: string
    unread?: boolean
    content?: string
    creatorInfo: {
      userId: string
      image: string
      name: string
    }
  }
}

export type FollowUpAction = {
  messageId?: string
  question?: string
  unread?: boolean
  content?: string
  type?: 'action'
  creatorInfo: {
    userId: string
    image: string
    name: string
  }
}

export type FollowUpActionType = {
  type: 'action'
  text?: string
  requestText?: string
  action?: FollowUpAction
}

type Props = StackScreenProps<{ FollowUpActivity: ParamProps }, 'FollowUpActivity'>

const FollowUpActivity: FC<Props> = props => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const dispatch = useDispatch()
  const { color } = useTheme()
  const info = props.route.params?.info
  const messageId = info?.id
  const [activities] = useState(() => {
    const activityQuestion: StudyPlan.QuestionAct = {
      type: 'question',
      messageId,
      question: `Encourage {{name}} action step 🙌`,
      possessiveName: Utils.possessive(info.creatorInfo?.name),
    }
    const activityAction: FollowUpActionType = {
      type: 'action',
      action: {
        creatorInfo: info.creatorInfo,
        messageId: info.id,
        question: info?.question || 'Check out how {{name}} took action this week!',
        unread: info.unread,
        content: info.content,
      },
    }

    const returnActs = [activityAction, activityQuestion]
    return returnActs
  })
  const [step, setStep] = useState(0)
  const [currentActivity, setCurrentActivity] = useState<StudyPlan.Activity | FollowUpActionType>()

  useEffect(() => {
    setCurrentActivity(activities[step])
    markAsRead()
  }, [activities, step])

  const markAsRead = () => {
    dispatch({
      type: TYPES.FOLLOW_UPS.MARK_AS_READ,
      payload: {
        groupId: group.id,
        actionStepsId: props.route.params.actionStepsId,
        followUpId: info.id,
      },
    })
  }
  const onPressNext = () => {
    if (step + 1 < activities.length) {
      setStep(s => s + 1)
    } else {
      NavigationRoot.pop()
    }
  }
  const ContentView = useMemo(() => {
    if (!currentActivity) return null
    switch (currentActivity.type) {
      case 'action':
        return <FollowUpHighlightAction key={step} info={currentActivity.action} onContinue={onPressNext} groupId={group.id} />
      case 'question':
        return <ActivityQuestion key={step} activity={currentActivity} onPressNext={onPressNext} isFollowUp />
      default:
        return null
    }
    return

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActivity, onPressNext])

  const onPressPrevious = () => setStep(s => (s - 1 >= 0 ? s - 1 : s))

  return (
    <Container safe={true} forceInset={{ bottom: true, top: true }} backgroundColor={color.id === 'light' ? '#fafafa' : color.background}>
      <ReadingProgress
        stepCount={2}
        currentStep={step + 1}
        onClosePress={() => {
          NavigationRoot.pop()
        }}
      />
      {currentActivity?.type ? (
        <View style={s.flex}>
          {ContentView}
          <TransparentNavigation mode="left" width={NAVIGATION_WIDTH[currentActivity.type].left} onPress={onPressPrevious} />
          <TransparentNavigation mode="right" width={NAVIGATION_WIDTH[currentActivity.type].right} onPress={onPressNext} />
        </View>
      ) : null}
    </Container>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
})

export default FollowUpActivity
