import GroupMemberAvatars from '@components/GroupMemberAvatars'
import { H2, H3, Title } from '@components/Typography'
import ActionSteps from '@dts/actionSteps'
import { RootState } from '@dts/state'
import useActionStepFeature from '@hooks/useActionStepFeature'
import useTheme from '@hooks/useTheme'
import { useBigStyle } from '@scenes/GroupHome/HomeScreen/constant'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Firestore from '@shared/Firestore'
import { Constants } from '@shared/index'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'

import ConnectionView from '../components/ConnectionView'

type Props = {
  isFinishedStudy: boolean | undefined
}

const GroupPrompt: React.FC<Props> = ({ isFinishedStudy }) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const activeActionStep = useSelector<RootState, RootState['actionSteps']['activeActionStep']>(state => state.actionSteps.activeActionStep)
  const isActionStepCompleted = activeActionStep?.completedMembers.includes(me.uid)
  const hasActionStepFeature = useActionStepFeature()
  const shouldShowConnectionView =
    !me.phoneNumber && group.org && group.org?.isRequirePhone && !(me.disabledRequirePhone || []).includes(group.org.id)

  if (hasActionStepFeature && activeActionStep && !isActionStepCompleted) {
    return <ActionStepGroupPrompt highlight={!!isFinishedStudy} actionStep={activeActionStep} groupId={group.id} />
  }

  return shouldShowConnectionView ? <ConnectionView /> : <></>
}

const ActionStepGroupPrompt: React.FC<{
  highlight: boolean
  actionStep: ActionSteps
  groupId: string
}> = ({ highlight = true, actionStep, groupId }) => {
  const { color } = useTheme()
  const Analytics = useAnalytic()
  return (
    <View style={styles.container}>
      <GradientCover disabled={!highlight}>
        <View
          style={[
            styles.infoWrapper,
            {
              backgroundColor: color.background,
            },
          ]}>
          <Title style={styles.icon}>{'🙌'}</Title>
          <H2 color="black2" style={styles.title}>
            {I18n.t('text.Take Action')}
          </H2>
          {actionStep.completedMembers.length > 2 && (
            <GroupMemberAvatars
              userIds={actionStep.completedMembers}
              avatarSize={28}
              avatarBorderSize={1}
              fontSize={10}
              style={styles.avatars}
            />
          )}
          <H3 color="gray8" style={styles.actionText} align="center" bold={false}>
            {actionStep.actionText}
          </H3>
        </View>
        <TouchableOpacity
          style={[
            styles.btn,
            highlight ? styles.btnHighlight : styles.btnNotHighlight,
            {
              backgroundColor: highlight ? color.accent : color.background,
              borderTopColor: highlight ? color.accent : color.id === 'light' ? color.whiteSmoke : color.gray3,
            },
          ]}
          onPress={async () => {
            Analytics.event(Constants.EVENTS.ACTIONS_STEP.COMPLETE_IN_HOME_SCREEN)
            await Firestore.ActionStep.markAsComplete({ actionStepId: actionStep.id, groupId })
            NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE_FOLLOW_UP, { actionSteps: actionStep })
          }}>
          <View style={styles.btnContent}>
            <H2 color={highlight ? 'white' : 'gray3'} style={styles.btnText}>
              {I18n.t('text.Mark as complete')}
            </H2>
          </View>
        </TouchableOpacity>
      </GradientCover>
    </View>
  )
}

type GProps = {
  disabled: boolean
  children: React.ReactNode
}
const GradientCover: React.FC<GProps> = props => {
  const { color } = useTheme()
  return props.disabled ? (
    <View
      style={[
        styles.gradientWrapper,
        {
          backgroundColor: color.id === 'light' ? color.whiteSmoke : color.gray3,
        },
      ]}>
      {props.children}
    </View>
  ) : (
    <LinearGradient
      style={styles.gradientWrapper}
      colors={['#FF88C1', '#8AB9FF']}
      start={{ x: -0.5, y: -0.5 }}
      end={{ x: 0.5, y: 0.5 }}
      locations={[0, 1]}
      useAngle={true}
      angle={226.05}
      angleCenter={{ x: 0.5, y: 0.5 }}>
      {props.children}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    marginBottom: 15,
  },
  infoWrapper: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 13,
    borderTopLeftRadius: 13,
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 53,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderTopWidth: 3,
  },
  btnHighlight: {
    marginLeft: -3,
    marginRight: -3,
    marginBottom: -3,
  },
  btnNotHighlight: {
    // marginLeft: -2,
    // marginRight: -2,
    // marginBottom: -2,
  },
  btnContent: { justifyContent: 'center', alignItems: 'center' },
  btnText: { fontWeight: '600' },
  icon: {
    marginBottom: useBigStyle ? 15 : 10,
    fontSize: 33,
  },
  title: {
    marginBottom: useBigStyle ? 15 : 10,
  },
  actionText: {
    marginBottom: useBigStyle ? 20 : 10,
  },
  avatars: { marginVertical: useBigStyle ? 10 : 5 },
  gradientWrapper: {
    borderRadius: 15,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 3,
    marginHorizontal: 9,
  },
})

export default GroupPrompt
