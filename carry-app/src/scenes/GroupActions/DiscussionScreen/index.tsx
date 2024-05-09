import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import PlanDiscussionList from '@scenes/GroupActions/DiscussionScreen/components/PlanDiscussionList'
import UnreadDiscussionList from '@scenes/GroupActions/DiscussionScreen/components/UnreadDiscussionList'
import { NavigationRoot } from '@scenes/root'

import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view'

const DiscussionScreen: React.FC = () => {
  const { color } = useTheme()
  const { landscape } = useScreenMode()

  const [tabViewState, setTabViewState] = useState({
    index: 0,
    routes: [
      { key: 'unread', title: I18n.t('text.Unread') },
      { key: 'all', title: I18n.t('text.All') },
    ],
  })
  const handleChangeTab = (index: number) => {
    setTabViewState({ ...tabViewState, index })
  }

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'unread':
        return <UnreadDiscussionList handleChangeTab={handleChangeTab} />
      case 'all':
        return <PlanDiscussionList />
      default:
        return null
    }
  }

  const initialLayout = {
    height: 0,
    width: Metrics.screen.width,
  }

  const renderHeader = props => {
    return (
      <TabBar
        {...props}
        activeColor={color.text}
        inactiveColor={color.gray3}
        style={[styles.tabBarStyle, { backgroundColor: color.background, borderBottomColor: color.gray5 }]}
        labelStyle={[styles.tabBarLabelStyle]}
        indicatorContainerStyle={styles.tabBarIndicatorStyle}
        indicatorStyle={[
          styles.indicatorStyle,
          { backgroundColor: color.text },
          landscape
            ? { width: Metrics.screen.height / 4, marginLeft: Metrics.screen.height / 8 }
            : { width: Metrics.screen.width / 4, marginLeft: Metrics.screen.width / 8 },
        ]}
      />
    )
  }

  return (
    <Container safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        title={`${I18n.t('text.Study discussions')} 💬`}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        titleStyle={styles.titleStyle}
      />
      <TabView
        sceneContainerStyle={styles.tabView}
        navigationState={tabViewState}
        renderScene={renderScene}
        renderTabBar={renderHeader}
        onIndexChange={handleChangeTab}
        initialLayout={initialLayout}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  tabView: { flex: 1 },
  tabBarStyle: {
    marginBottom: 10,
    elevation: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabelStyle: {
    fontWeight: 'bold',
  },
  tabBarIndicatorStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorStyle: {
    borderRadius: 3,
    height: 3,
    alignSelf: 'center',
    width: Metrics.screen.width / 4,
    marginLeft: Metrics.screen.width / 8,
  },
  titleStyle: {
    paddingLeft: 10,
  },
})

export default DiscussionScreen
