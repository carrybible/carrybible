import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { RootState } from '@dts/state'
import useInitStudyPlanData from '@hooks/useInitStudyPlanData'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useStudyPlanMoreOptions from '@hooks/useStudyPlanMoreOptions'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React from 'react'
import { Animated, FlatList, StyleSheet, View } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view'
import { useSelector } from 'react-redux'

import { StudyPreviewContext } from './context'
import HistoryTab from './HistoryTab'
import StudyPreviewPlan from './PlanTab'
import StudyPreviewProgress from './StudyPreviewProgress'

const initialLayout = {
  height: 0,
  width: Metrics.screen.width,
}

const StudyPlanScreen = () => {
  const { color } = useTheme()
  const studyPlanData = useInitStudyPlanData()
  const { landscape } = useScreenMode()

  // total height of all header view (progress + tab view)
  const [headerHeight, setHeaderHeight] = React.useState(378)
  // height of the progress view only (the part we want to hide when scrolling)
  const [scrollableHeight, setScrollableHeight] = React.useState(72)
  const [screenHeight, setScreenHeight] = React.useState(0)

  const [tabViewState, setTabViewState] = React.useState({
    index: 0,
    routes: [
      { key: 'plan', title: I18n.t('text.Plan') },
      { key: 'history', title: I18n.t('text.History') },
    ],
  })

  const scrollData = React.useRef({
    plan: {
      index: 0,
      scrollValue: new Animated.Value(0),
      scrollRef: React.useRef<FlatList>(null),
    },
    history: {
      index: 1,
      scrollValue: new Animated.Value(0),
      scrollRef: React.useRef<FlatList>(null),
    },
  })

  // Synchronize the scroll value of multiple FlatList
  React.useEffect(() => {
    const removeListenerList = Object.values(scrollData.current).map(({ scrollValue, index }) => {
      if (index !== tabViewState.index) {
        return () => null
      }
      const id = scrollValue.addListener(({ value }) => {
        Object.keys(scrollData.current).forEach(key => {
          if (index !== scrollData.current[key].index) {
            if (value <= headerHeight - 30) {
              scrollData.current[key].scrollRef.current?.scrollToOffset({ offset: value, animated: false })
            }
          }
        })
      })

      return () => {
        scrollValue.removeListener(id)
      }
    })

    return () => {
      removeListenerList.forEach(func => func())
    }
  }, [headerHeight, tabViewState.index])

  const [paddingBottom, setPaddingBottom] = React.useState({})
  const renderScene = ({ route }) => {
    const flatListProps = {
      scrollEventThrottle: 1,
      onScroll: Animated.event(
        [
          {
            nativeEvent: { contentOffset: { y: scrollData.current[route.key].scrollValue } },
          },
        ],
        { useNativeDriver: true },
      ),
      contentContainerStyle: {
        paddingTop: headerHeight,
      },
      ListFooterComponent: () => <View style={{ height: paddingBottom[route.key] }} />,
      scrollRef: scrollData.current[route.key].scrollRef,
      onLayout: e => {
        if (screenHeight > Metrics.screen.height / 2) {
          return
        }
        setScreenHeight(e.nativeEvent.layout.height)
      },
      onContentSizeChange: (width, currentHeight) => {
        if (!screenHeight) {
          return
        }
        const minHeight = screenHeight + scrollableHeight
        const missingPaddingBottom = minHeight - currentHeight
        if (missingPaddingBottom > 15) {
          if (paddingBottom[route.key] == null || missingPaddingBottom < paddingBottom[route.key]) {
            setPaddingBottom(paddingBottom => ({
              ...paddingBottom,
              [route.key]: missingPaddingBottom,
            }))
          }
        } else if (missingPaddingBottom < -15) {
          setPaddingBottom(paddingBottom => ({
            ...paddingBottom,
            [route.key]: 0,
          }))
        }
      },
    }

    switch (route.key) {
      case 'plan': {
        return <StudyPreviewPlan flatListProps={flatListProps} />
      }
      case 'history': {
        return <HistoryTab flatListProps={flatListProps} />
      }
      default:
        return null
    }
  }
  const renderHeader = (props, hideHeader?: boolean) => {
    // const key = tabViewState.routes[tabViewState.index].key
    // Depend translateY to only 1 scroll view to prevent lagging when switch tab,
    // the correctness still preserved bc we already sync 2 scroll view
    const translateY = scrollData.current.plan.scrollValue.interpolate({
      inputRange: [0, scrollableHeight],
      outputRange: [0, -scrollableHeight],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          s.headerWrapper,
          {
            transform: [{ translateY }],
          },
        ]}>
        {hideHeader ? null : <Header onLayout={e => setScrollableHeight(e.nativeEvent.layout.height)} landscape={false} />}
        <TabBar
          {...props}
          activeColor={color.text}
          inactiveColor={color.gray3}
          style={[s.tabBarStyle, { backgroundColor: color.background, borderBottomColor: color.gray5 }]}
          contentContainerStyle={{}}
          labelStyle={[s.tabBarLabelStyle]}
          indicatorContainerStyle={s.tabBarIndicatorStyle}
          indicatorStyle={[
            s.indicatorStyle,
            { backgroundColor: color.text },
            landscape
              ? { width: Metrics.screen.height / 8, marginLeft: Metrics.screen.height / 16 }
              : { width: Metrics.screen.width / 4, marginLeft: Metrics.screen.width / 8 },
          ]}
        />
      </Animated.View>
    )
  }
  const handleChangeTab = (index: number) => {
    setTabViewState({ ...tabViewState, index })
  }

  const { onPress, renderPopup } = useStudyPlanMoreOptions({
    plan: studyPlanData.plan,
  })

  return (
    // @ts-ignore
    <StudyPreviewContext.Provider value={studyPlanData}>
      <Container safe forceInset={{ bottom: false, top: true }}>
        <HeaderBar
          title={I18n.t('text.Study plans')}
          borderedBottom
          borderedBottomGradient
          style={s.headerBarStyle}
          {...(onPress
            ? {
                iconRight: 'more-vertical',
                onPressRight: onPress,
                colorRight: color.text,
              }
            : {})}
        />
        {landscape ? (
          <ScreenView separateHorizontal>
            <Header onLayout={e => setScrollableHeight(e.nativeEvent.layout.height)} landscape={landscape} />
            <TabView
              navigationState={tabViewState}
              renderScene={renderScene}
              renderTabBar={data => renderHeader(data, true)}
              onIndexChange={handleChangeTab}
              initialLayout={initialLayout}
            />
          </ScreenView>
        ) : (
          <View style={s.flex}>
            <TabView
              navigationState={tabViewState}
              renderScene={renderScene}
              renderTabBar={renderHeader}
              onIndexChange={handleChangeTab}
              initialLayout={initialLayout}
            />
          </View>
        )}

        {renderPopup()}
      </Container>
    </StudyPreviewContext.Provider>
  )
}

const Header = ({ onLayout, landscape }) => {
  const { color } = useTheme()

  return (
    <View style={{ backgroundColor: color.background }} onLayout={onLayout}>
      <View style={[s.header, landscape ? s.headerView : {}]}>
        <View style={s.flex} />
      </View>

      <StudyPreviewProgress />
    </View>
  )
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 41,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
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
  },
  headerBarStyle: {
    zIndex: 1,
  },
  headerView: {
    height: 25,
    marginTop: 0,
    marginBottom: 0,
  },
})

const ExportStudyPlanScreen = ({ ...props }) => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  return <StudyPlanScreen key={group.id} {...props} />
}

export default ExportStudyPlanScreen
