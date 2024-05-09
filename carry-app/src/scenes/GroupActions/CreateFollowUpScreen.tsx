import Container from '@components/Container'
import ActionSteps from '@dts/actionSteps'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import ReadingProgress from '@scenes/Study/Main/components/ReadingProgress'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import React, { FC, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import FollowUpCompleteAnimation from './components/FollowUpCompleteAnimation'
import FollowUpCreate from './components/FollowUpCreate'

type ParamProps = { actionSteps: ActionSteps; onFinish?: () => void; hasCompleteAnimation: boolean }

type Props = StackScreenProps<{ CreateFollowUpScreen: ParamProps }, 'CreateFollowUpScreen'>

type ActivityType = 'create' | 'animation'

const CreateFollowUpScreen: FC<Props> = props => {
  const {
    route: {
      params: { actionSteps, onFinish, hasCompleteAnimation = true },
    },
  } = props
  const Analytics = useAnalytic()
  const { color } = useTheme()
  const dispatch = useDispatch()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [currentActivity, setCurrentActivity] = useState<ActivityType>('create')
  // Effect load data
  const handleLoadData = React.useCallback(
    (
      options = {
        isLoadMore: false,
        isRefresh: true,
      },
    ) => {
      const { isLoadMore, isRefresh } = options
      dispatch({
        type: TYPES.FOLLOW_UPS.LOAD,
        payload: {
          isLoadMore,
          isRefresh,
          groupId: group.id,
          actionStepsId: actionSteps.id,
        },
      })
    },
    [actionSteps.id, dispatch, group.id],
  )

  const onShare = () => {
    Analytics.event(Constants.EVENTS.ACTIONS_STEP.SKIP_ACTION_STEP_FOLLOW_UP)
    if (!hasCompleteAnimation || currentActivity === 'animation') {
      devLog('hasCompleteAnimation 1', hasCompleteAnimation, currentActivity)
      handleLoadData()
      NavigationRoot.pop()
      onFinish?.()
    } else {
      setCurrentActivity('animation')
    }
  }

  const ContentView = useMemo(() => {
    switch (currentActivity) {
      case 'create':
        return <FollowUpCreate actionSteps={actionSteps} onShare={onShare} />
      case 'animation':
        return <FollowUpCompleteAnimation onPressDone={onShare} />
      default:
        return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActivity])
  return (
    <Container safe={true} forceInset={{ bottom: true, top: true }} backgroundColor={color.id === 'light' ? '#fafafa' : color.background}>
      <ReadingProgress
        stepCount={0}
        onClosePress={() => {
          if (currentActivity === 'animation') onShare()
          else NavigationRoot.pop()
        }}
      />
      <View style={s.flex}>{ContentView}</View>
    </Container>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
})

export default CreateFollowUpScreen
