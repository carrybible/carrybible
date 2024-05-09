import { Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import TabBarDot from '@scenes/Study/Creation/AdvancedStudy/components/TabBarDot'
import Constants from '@shared/Constants'
import { Firestore, Metrics } from '@shared/index'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, InteractionManager, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'

import IntroActionStep from './IntroActionStep'
import SelectDurationActionStep from './SelectDurationActionStep'
import WriteNewActionStep from './WriteNewActionStep'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ ActionStepCreationModal: ParamProps }, 'ActionStepCreationModal'>

const ActionStepCreationModal: React.FC<Props> = () => {
  const { color } = useTheme()
  const dispatch = useDispatch()
  const { showLoading, hideLoading } = useLoading()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { modal, onClosed } = useModal()
  const { handleIndexChange, navigationState, height } = useTabView({
    initNavigationState: () => {
      const routes: RouteType[] = [
        {
          index: 0,
          key: 'intro',
          height: Math.min(466, Metrics.screen.height),
          opacity: new Animated.Value(1),
        },
        {
          index: 1,
          key: 'write-action-step',
          height: 345,
          opacity: new Animated.Value(0),
        },
        {
          index: 2,
          key: 'choose-duration',
          height: 345,
          opacity: new Animated.Value(0),
        },
      ]
      return {
        index: 0,
        routes,
      }
    },
  })

  const [actionText, setActionText] = useState('')
  const handleSubmit = useCallback(
    async (duration: number) => {
      if (!actionText) {
        toast.error(I18n.t('text.Missing the action text'))
        return
      }
      const existActiveActionStep = await Firestore.ActionStep.getActiveActionStep(group.id)
      if (existActiveActionStep) {
        const confirm = await new Promise(resolve => {
          NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
            titleIcon: <Text style={s.titleIcon}>{'👋'}</Text>,
            title: I18n.t('text.Just checking'),
            description: I18n.t('text.Creating a new action step will replace your current one. Do you wish to proceed'),
            confirmTitle: I18n.t('text.Yes replace it'),
            cancelTitle: I18n.t('text.Cancel'),
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          })
        })

        if (!confirm) {
          return
        }
      }

      showLoading()
      await Firestore.ActionStep.createActionStep({
        groupId: group.id,
        duration,
        actionText,
      })
      hideLoading()
      toast.success(I18n.t('text.Action step created successfully'))

      dispatch({
        type: TYPES.ACTION_STEPS.SYNC_ACTIVE_ACTION_STEP,
      })

      onClosed()
    },
    [actionText, dispatch, group.id, hideLoading, onClosed, showLoading],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'intro': {
        return <IntroActionStep onPress={() => handleIndexChange(route.index + 1)} />
      }
      case 'write-action-step': {
        return (
          <WriteNewActionStep
            onPress={() => handleIndexChange(route.index + 1)}
            value={actionText}
            onChange={setActionText}
            opacity={route.opacity}
          />
        )
      }
      case 'choose-duration': {
        return <SelectDurationActionStep onPress={handleSubmit} />
      }
      default:
        return null
    }
  }

  return (
    <Modalize
      ref={modal}
      onClosed={onClosed}
      disableScrollIfPossible
      adjustToContentHeight
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
    >
      <View style={{ height, paddingBottom: Metrics.safeArea.bottom }}>
        <TabView
          navigationState={navigationState}
          renderScene={renderScene}
          renderTabBar={props => <TabBarDot {...props} />}
          tabBarPosition={'bottom'}
          onIndexChange={handleIndexChange}
          initialLayout={INITIAL_LAYOUT}
          swipeEnabled={navigationState.index === navigationState.routes.length - 1}
          lazy
        />
      </View>
    </Modalize>
  )
}

const useModal = () => {
  const modal = useRef<Modalize>(null)

  useEffect(() => {
    openModal()
  }, [])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      NavigationRoot.pop()
    })
  }

  const openModal = () => {
    if (modal.current) {
      modal.current.open()
    }
  }
  return {
    modal,
    onClosed,
    openModal,
  }
}

type RouteType = {
  key: string
  height: number
  index: number
  opacity: Animated.Value
}

const useTabView = ({
  initNavigationState,
}: {
  initNavigationState: () => {
    index: number
    routes: RouteType[]
  }
}) => {
  const { custom } = useLayoutAnimation()
  const [height, setHeight] = useState(Math.min(466, Metrics.screen.height))
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
  const [navigationState, setNavigationState] = React.useState(initNavigationState)
  const handleIndexChange = useCallback(
    async (index: number) => {
      await changeOpacity(navigationState.routes[navigationState.index].opacity, 0)
      setNavigationState({ ...navigationState, index })
      // Need to wait for the swipe animation of react-native-tabview to finish
      // before changing the height of modal to prevent conflict in animation
      await wait(500)

      custom()
      const newHeight = navigationState.routes[index].height
      if (newHeight < height) {
        setHeight(navigationState.routes[index].height - 1)
        await wait(1)
      }
      setHeight(navigationState.routes[index].height)
      await wait(250)
      await changeOpacity(navigationState.routes[index].opacity, 1)
    },
    [changeOpacity, custom, height, navigationState],
  )

  return {
    height,
    navigationState,
    handleIndexChange,
  }
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
})

export default ActionStepCreationModal
