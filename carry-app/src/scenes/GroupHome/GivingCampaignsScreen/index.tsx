import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Config from '@shared/Config'
import Constants from '@shared/Constants'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { FC, useEffect, useRef, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { TabBar, TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import GivingList from './components/GivingList'
import Tithing from './components/Tithing'

type Props = {
  //
}

const GivingCampaignsScreen: FC<Props> = () => {
  const { color } = useTheme()
  const dispatch = useDispatch()
  const organisation = useSelector<RootState, RootState['organisation']>(state => state.organisation)
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const [tithingHeight, setTithingHeight] = useState(0)
  const translateYOffsetTithing = useSharedValue(0)
  const offsetOpacity = useSharedValue(1)
  const paddingListOffset = useSharedValue(0)
  const refCurrent = useRef<FlatList>(null)
  const refPast = useRef<FlatList>(null)

  const animatedStylesTithing = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateYOffsetTithing.value * 1 }],
      opacity: offsetOpacity.value,
    }
  })
  const animatedStylesTab = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateYOffsetTithing.value * 1 }],
      height: Metrics.screen.height + translateYOffsetTithing.value,
    }
  })

  const paddingTopStyle = useAnimatedStyle(() => {
    return {
      paddingTop: paddingListOffset.value,
    }
  })

  const { activeCampaigns, endedCampaigns } = organisation

  const [tabViewState, setTabViewState] = useState({
    index: 0,
    routes: [
      { key: 'current-giving', title: I18n.t('text.Current') },
      { key: 'past-giving', title: I18n.t('text.Past giving') },
    ],
  })
  const handleChangeTab = (index: number) => {
    setTabViewState({ ...tabViewState, index })
  }

  useEffect(() => {
    const run = async () => {
      if (group.organisation?.campusId) {
        dispatch({
          type: TYPES.ORGANISATION.GET_TITHINGS,
          payload: { campusId: group.organisation?.campusId, organisationId: group.organisation?.id },
        })
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'current-giving':
        return (
          <GivingList
            ref={refCurrent}
            type="current-giving"
            data={activeCampaigns}
            // onScroll={scrollHandler}
            paddingTopStyle={paddingTopStyle}
          />
        )
      case 'past-giving':
        return <GivingList ref={refPast} type="past-giving" data={endedCampaigns} paddingTopStyle={paddingTopStyle} />
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
          { width: Metrics.screen.width / 4, marginLeft: Metrics.screen.width / 8 },
        ]}
      />
    )
  }

  return (
    <Container safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        title={`${I18n.t('text.Giving')} 🤝`}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        titleStyle={styles.titleStyle}
      />
      <View style={[styles.container, { marginBottom: -tithingHeight - 82 }]}>
        {organisation.tithings?.length ? (
          <Animated.View style={animatedStylesTithing}>
            <Tithing
              data={organisation.tithings[0]}
              orgImg={organisation.tithings[0].image}
              onLayout={e => setTithingHeight(e.nativeEvent.layout.height)}
              onPressGiveNow={() => {
                NavigationRoot.navigate(Constants.SCENES.MODAL.DONATE, {
                  onClose: () => undefined,
                  fund: organisation.tithings[0],
                })
              }}
            />
          </Animated.View>
        ) : null}
        <Animated.View style={[animatedStylesTab, styles.tabContainer]}>
          <TabView
            sceneContainerStyle={styles.tabView}
            navigationState={tabViewState}
            renderScene={renderScene}
            renderTabBar={renderHeader}
            onIndexChange={handleChangeTab}
            initialLayout={initialLayout}
          />
        </Animated.View>
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  tabView: { height: Metrics.screen.height + 82 },
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
    left: 10,
  },
  container: { flex: 1 },
  tabContainer: { flexGrow: 1 },
})

export default GivingCampaignsScreen
