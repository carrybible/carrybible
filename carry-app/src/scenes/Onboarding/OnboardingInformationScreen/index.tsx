import useLayoutAnimation from '@hooks/useLayoutAnimations'
import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { TabView } from 'react-native-tab-view'
import I18n from 'i18n-js'

import Container from '@components/Container'
import { NavigationRoot } from '@scenes/root'
import { Metrics } from '@shared/index'
import HeaderBar from '@components/HeaderBar'
import useTheme from '@hooks/useTheme'
import BottomButton from '@components/BottomButton'

import BuildHabitContent from './BuildHabitContent'
import GrowContent from './GrowContent'
import LifeTransformContent from './LifeTransformContent'
import WelcomeToCarry from './WelcomeToCarry'
import TabBarDot from '@scenes/Study/Creation/AdvancedStudy/components/TabBarDot'

const InitialLayout = {
  height: 0,
  width: Metrics.screen.width,
}

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ OnboardingInformationScreen: ParamProps }, 'OnboardingInformationScreen'>

const OnboardingInformationScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const [btnTitle, setBtnTitle] = useState(I18n.t('text.Let s do this'))
  const { custom } = useLayoutAnimation()

  const showBackBtn = props.navigation.getState().routes.length > 1

  const [tabViewState, setTabViewState] = React.useState({
    index: 0,
    routes: [
      {
        key: 'welcome_to_carry',
        btnTitle: I18n.t('text.Let s do this'),
      },
      {
        key: 'build_habit',
        btnTitle: I18n.t('text.Wow sounds great'),
      },
      {
        key: 'transform_life',
        btnTitle: I18n.t('text.Tell me more'),
      },
      {
        key: 'grow',
        btnTitle: I18n.t('text.Let s jump in'),
      },
    ],
  })

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'welcome_to_carry': {
        return <WelcomeToCarry />
      }
      case 'build_habit': {
        return <BuildHabitContent />
      }
      case 'transform_life': {
        return <LifeTransformContent />
      }
      case 'grow': {
        return <GrowContent />
      }
      default:
        return null
    }
  }

  const handleChangeTab = (index: number) => {
    setTabViewState({ ...tabViewState, index })
    setBtnTitle(tabViewState.routes[index].btnTitle)
  }

  const onPressContinue = () => {
    if (tabViewState.index !== tabViewState.routes.length - 1) {
      handleChangeTab(tabViewState.index + 1)
      if (tabViewState.index === tabViewState.routes.length - 2) {
        custom()
      }
    } else {
      onJumpIn()
    }
  }

  const onJumpIn = () => {
    NavigationRoot.home()
  }

  // react-native-pager-view will crash if we navigate back too fast on iOS.
  // Need to workaround to prevent user to tap on the back button too fast
  // https://github.com/callstack/react-native-pager-view/issues/458
  const blockBackBtn = useRef(false)
  const handleBackPress = useCallback(() => {
    if (blockBackBtn.current) {
      return
    }
    blockBackBtn.current = true
    setTimeout(() => {
      blockBackBtn.current = false
    }, 500)
    if (tabViewState.index > 0) {
      handleChangeTab(tabViewState.index - 1)
    } else {
      NavigationRoot.pop()
    }
  }, [handleChangeTab, tabViewState.index])

  return (
    <Container safe={true} style={styles.container}>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.gray2}
        iconLeftSize={22}
        onPressLeft={showBackBtn || tabViewState.index > 0 ? handleBackPress : undefined}
      />
      <View style={styles.contentWrapper}>
        <TabView
          navigationState={tabViewState}
          renderScene={renderScene}
          onIndexChange={handleChangeTab}
          initialLayout={InitialLayout}
          renderTabBar={props => <TabBarDot {...props} />}
          swipeEnabled={true}
          tabBarPosition={'bottom'}
        />
      </View>
      <BottomButton title={btnTitle} rounded={true} onPress={onPressContinue} />
      <View
        /* eslint-disable-next-line react-native/no-inline-styles */
        style={{
          opacity: tabViewState.index !== tabViewState.routes.length - 1 ? 1 : 0,
        }}
      >
        <BottomButton
          style={{
            backgroundColor: color.background,
          }}
          title={I18n.t('text.Skip')}
          titleStyle={[{ color: color.gray }, styles.skipButtonTitle]}
          onPress={onJumpIn}
        />
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  contentWrapper: {
    flex: 1,
    marginBottom: 15,
  },
  skipButtonTitle: { fontWeight: 'normal' },
})

export default OnboardingInformationScreen
