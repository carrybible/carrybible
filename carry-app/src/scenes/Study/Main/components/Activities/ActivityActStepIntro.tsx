import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import GroupMemberAvatars from '@components/GroupMemberAvatars'
import { H2, Text, Title } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { GradientCover } from '@scenes/GroupHome/components/ConnectionView'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Firestore from '@shared/Firestore'
import { Constants } from '@shared/index'
import Metrics from '@shared/Metrics'
import { differenceInDays, isSameDay } from 'date-fns'
import I18n from 'i18n-js'
import React, { useMemo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

interface Props {
  activity: StudyPlan.ActStepAct
  onPress: () => void
}

const ActivityActStepIntro: React.FC<Props> = ({ activity, onPress }) => {
  const { color } = useTheme()
  const Analytics = useAnalytic()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { actionStep } = activity
  const isPrompt = useMemo(() => {
    const { fromDate, toDate } = actionStep
    const duration = differenceInDays(toDate.toMillis(), fromDate.toMillis())
    const isScheduleForOneDay = duration < 1.5
    if (isScheduleForOneDay) {
      return true
    }

    const isSameDateWithFromDate = isSameDay(Date.now(), fromDate.toMillis())
    if (isSameDateWithFromDate) {
      return false
    }
    return true
  }, [actionStep])

  const { title } = useMemo(() => {
    if (isPrompt) {
      return {
        title: actionStep.actionPromptText ?? I18n.t('text.Have you taken action today'),
      }
    }
    return {
      title: I18n.t('text.Introducing our next action step'),
    }
  }, [actionStep.actionPromptText, isPrompt])

  const onPressContinue = () => {
    onPress()
  }

  return (
    <Container safe>
      <View style={[s.container, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
        <Title style={s.icon}>{'🙌'}</Title>
        <H2 style={s.textBold}>{title}</H2>
        {isPrompt ? (
          <GroupMemberAvatars avatarSize={Metrics.screen.width * 0.14} avatarBorderSize={2} fontSize={25} />
        ) : (
          <Avatar touchable={false} size={150} url={group.image} loading={false} borderWidth={5} borderColor={'#EDEEF3'} style={s.avatar} />
        )}

        <GradientCover borderRadius={15} style={s.gradient}>
          <View
            style={[
              {
                backgroundColor: color.id === 'light' ? color.white : color.black,
              },
              s.content,
            ]}
          >
            <Text numberOfLines={8} style={s.center}>
              {actionStep.actionText}
            </Text>
          </View>
        </GradientCover>
      </View>
      <Animated.View style={s.btnAnim}>
        {isPrompt ? (
          <>
            <BottomButton
              title={I18n.t('text.Mark as complete')}
              rounded
              onPress={async () => {
                Analytics.event(Constants.EVENTS.ACTIONS_STEP.COMPLETE_IN_DAILY_FLOW)
                await Firestore.ActionStep.markAsComplete({ actionStepId: actionStep.id, groupId: group.id })
                NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE_FOLLOW_UP, {
                  actionSteps: actionStep,
                  onFinish: onPressContinue,
                })
              }}
              style={s.btn}
            />
            <BottomButton
              title={I18n.t('text.Not yet')}
              rounded
              onPress={onPressContinue}
              style={[s.btn, s.transBg]}
              textColor="gray3"
              titleStyle={s.transTitle}
            />
          </>
        ) : (
          <BottomButton title={I18n.t('text.Continue')} rounded onPress={onPressContinue} style={s.btn} />
        )}
      </Animated.View>
    </Container>
  )
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 20 },
  content: { margin: 3, borderRadius: 13, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  btnAnim: { width: '100%' },
  btn: { alignSelf: 'stretch' },
  icon: { fontSize: 40 },
  textBold: {
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  center: { textAlign: 'center' },
  gradient: { width: '90%', marginTop: 30 },
  avatar: { marginTop: 5 },
  transBg: { backgroundColor: 'transparent' },
  transTitle: { fontWeight: 'normal' },
})

export default ActivityActStepIntro
