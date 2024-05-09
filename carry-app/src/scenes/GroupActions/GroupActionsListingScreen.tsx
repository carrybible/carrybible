import Container from '@components/Container'
import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import SearchBar from '@components/SearchBar'
import { Subheading } from '@components/Typography'
import { GroupActionsType, GroupTabType } from '@dts/groupAction'
import { RootState } from '@dts/state'
import useScreenMode from '@hooks/useScreenMode'

import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'

import { TYPES } from '@redux/actions'

import { NavigationRoot } from '@scenes/root'
import { Constants, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'

import SocialActionListingItem from './components/SocialActionListingItem'

type ParamProps = { type: GroupActionsType }

type Props = StackScreenProps<{ ActivityListScreen: ParamProps }, 'ActivityListScreen'>

const GroupActionsListingScreen: FC<Props> = props => {
  const {
    route: {
      params: { type },
    },
  } = props

  const { color } = useTheme()
  const dispatch = useDispatch()
  const { data } = useSelector<RootState, RootState['groupActions']>(state => state.groupActions)
  const [searchValue, setSearchValue] = useState('')
  const { title, placeholder, unreadText } = useString(type)
  const { landscape } = useScreenMode()

  // Effect clear data
  useEffect(() => {
    return () => {
      dispatch({
        type: TYPES.GROUP_ACTIONS.CLEAR,
      })
    }
  }, [dispatch])

  // Effect load data
  const handleLoadData = useCallback(
    (
      searchValue: string,
      options = {
        isLoadMore: false,
        isRefresh: false,
      },
    ) => {
      const { isLoadMore, isRefresh } = options
      dispatch({
        type: TYPES.GROUP_ACTIONS.LOAD,
        payload: {
          type,
          isLoadMore,
          isRefresh,
        },
      })
    },
    [dispatch, type],
  )

  const activities = useMemo(() => {
    if (searchValue && data) {
      return data.filter(
        item =>
          item.content.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.creatorInfo.name.toLowerCase().includes(searchValue.toLowerCase()),
      )
    }
    return data
  }, [data, searchValue])

  useEffect(() => {
    handleLoadData(searchValue)
    // Ignore handleLoadData in depsList
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = async () => {
    setRefreshing(true)
    await handleLoadData(searchValue, { isRefresh: true, isLoadMore: false })
    setRefreshing(false)
  }
  const handleLoadMore = async () => {
    await handleLoadData(searchValue, { isRefresh: false, isLoadMore: true })
  }

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

  const onPressMarkAllAsRead = () => {
    const ids = activities?.filter(i => i.unread).map(it => it.id)

    dispatch({
      type: TYPES.GROUP_ACTIONS.VIEW_ALL,
      payload: {
        ids,
        type,
      },
    })
  }

  const renderItem = ({ item }) => <SocialActionListingItem info={item} unreadText={unreadText} isUnread={!!item.unread} />

  const renderScene = ({ route }) => {
    let listData = activities
    if (route.key === 'unread') {
      listData = listData?.filter(i => i.unread)
    }
    return (
      <>
        {route.key === 'all' ? (
          <SearchBar placeholder={placeholder} onSearch={setSearchValue} style={styles.searchBar} />
        ) : listData?.length ? (
          <TouchableOpacity style={styles.markAsReadContainer} onPress={onPressMarkAllAsRead}>
            <Icon style={styles.markAsReadIcon} color={color.accent} source={require('@assets/icons/ic-mark-as-read.png')} size={16} />
            <Subheading color="accent" bold>
              {I18n.t('text.Mark all as read')}
            </Subheading>
          </TouchableOpacity>
        ) : null}

        <FlatList
          key={landscape ? 4 : 2}
          style={styles.listWrapper}
          contentContainerStyle={styles.listContentWrapper}
          columnWrapperStyle={styles.listColumnWrapper}
          data={listData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={() => {
            if (activities == null) {
              return <Loading />
            }
            return <EmptyActivity type={type} routeKey={route.key} />
          }}
          numColumns={landscape ? 4 : 2}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
        />
      </>
    )
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

  const initialLayout = {
    height: 0,
    width: Metrics.screen.width,
  }

  return (
    <Container safe={true} style={styles.container}>
      <HeaderBar
        title={title}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        iconRight={'edit'}
        colorRight={color.text}
        iconRightSize={22}
        onPressRight={() => {
          NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE, { type })
        }}
      />

      <TabView
        navigationState={tabViewState}
        renderScene={renderScene}
        renderTabBar={renderHeader}
        onIndexChange={handleChangeTab}
        initialLayout={initialLayout}
        sceneContainerStyle={styles.tabView}
      />
    </Container>
  )
}

const ItemSeparator = () => {
  return <View style={styles.separator} />
}

const EmptyActivity: FC<{
  type: GroupActionsType
  routeKey: GroupTabType
}> = memo(({ type, routeKey }) => {
  // eslint-disable-next-line no-unused-vars
  const IMAGE_MAP: { [key in GroupActionsType]: string } = {
    prayer: '🙏',
    gratitude: '🎉',
  }
  const { emptyUnreadTitleText, emptyUnreadText, emptyAllText, emptyAllTitleText } = useString(type)
  const { color } = useTheme()
  return (
    <EmptyData
      type="textIcon"
      text={routeKey === 'unread' ? emptyUnreadTitleText : emptyAllTitleText}
      subText={routeKey === 'unread' ? emptyUnreadText : emptyAllText}
      image={IMAGE_MAP[type]}
      style={styles.emptyWrapper}
      imgStyle={styles.emptyImage}
      subtextStyle={styles.emptySubtext}
      iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
    />
  )
})

// eslint-disable-next-line no-unused-vars
const TRANSLATION_MAP: { [key in GroupActionsType]: { [key: string]: string } } = {
  prayer: {
    title: 'text.Icon Prayer',
    placeholder: 'text.Search for a prayer request',
    unreadText: 'text.View prayer',
    emptyUnreadTitleText: 'text.No new prayers',
    emptyUnreadText: 'text.Tap the All button to view past prayers',
    emptyAllTitleText: 'text.You have no prayers',
    emptyAllText: 'text.Prayers help your group connect and go deeper',
  },
  gratitude: {
    title: 'text.Icon Gratitude entries',
    placeholder: 'text.Search for a gratitude entry',
    unreadText: 'text.View entry',
    emptyUnreadTitleText: 'text.No new entries',
    emptyUnreadText: 'text.Tap the All button to view past gratitude entries',
    emptyAllTitleText: 'text.You have no entries',
    emptyAllText: 'text.Gratitude entries are great ways to celebrate how God is moving',
  },
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  searchBar: {
    marginTop: 6,
  },
  tabView: {
    flex: 1,
  },
  listWrapper: {
    marginTop: 15,
  },
  listContentWrapper: {
    marginHorizontal: 16,
    paddingHorizontal: 1,
    paddingBottom: Metrics.safeArea.bottom,
  },
  listColumnWrapper: { justifyContent: 'space-between' },
  emptyWrapper: {
    marginTop: '20%',
    justifyContent: 'center',
  },
  emptyImage: {
    flexGrow: undefined,
    marginBottom: 10,
    width: 135,
    height: 135,
  },
  emptySubtext: {
    marginTop: 10,
    width: '60%',
  },
  separator: {
    height: 10,
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
    width: Metrics.screen.width / 4,
    marginLeft: Metrics.screen.width / 8,
  },
  markAsReadContainer: {
    alignSelf: 'flex-end',
    marginRight: Metrics.insets.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  markAsReadIcon: {
    marginRight: 5,
  },
})

const useString = (type: GroupActionsType) => {
  const { title, placeholder, unreadText, emptyUnreadTitleText, emptyUnreadText, emptyAllText, emptyAllTitleText } = useMemo(() => {
    return {
      title: I18n.t(TRANSLATION_MAP[type].title),
      placeholder: I18n.t(TRANSLATION_MAP[type].placeholder),
      unreadText: I18n.t(TRANSLATION_MAP[type].unreadText),
      emptyUnreadTitleText: I18n.t(TRANSLATION_MAP[type].emptyUnreadTitleText),
      emptyUnreadText: I18n.t(TRANSLATION_MAP[type].emptyUnreadText),
      emptyAllText: I18n.t(TRANSLATION_MAP[type].emptyAllText),
      emptyAllTitleText: I18n.t(TRANSLATION_MAP[type].emptyAllTitleText),
    }
  }, [type])

  return {
    title,
    placeholder,
    unreadText,
    emptyUnreadTitleText,
    emptyUnreadText,
    emptyAllText,
    emptyAllTitleText,
  }
}

export default GroupActionsListingScreen
