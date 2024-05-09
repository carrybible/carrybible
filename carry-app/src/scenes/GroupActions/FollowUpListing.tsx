import Container from '@components/Container'

import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'

import Icon from '@components/Icon'
import Loading from '@components/Loading'
import SearchBar from '@components/SearchBar'

import { Subheading } from '@components/Typography'
import ActionSteps from '@dts/actionSteps'
import FollowUp from '@dts/followUp'
import { RootState } from '@dts/state'

import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'

import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import SocialActionListingItem from './components/SocialActionListingItem'

type ParamProps = { actionSteps: ActionSteps }

type Props = StackScreenProps<{ FollowUpListing: ParamProps }, 'FollowUpListing'>

const FollowUpListing: FC<Props> = props => {
  const { color } = useTheme()
  const dispatch = useDispatch()
  const Analytics = useAnalytic()
  const data = useSelector<RootState, RootState['actionSteps']['followUps']>(state => state.actionSteps.followUps)
  const { loadingFollowUps } = useSelector<RootState, RootState['actionSteps']>(state => state.actionSteps)
  const [searchValue, setSearchValue] = useState('')
  const { actionSteps } = props.route.params
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ACTIONS_STEP.VIEW_ACTION_STEP_FOLLOW_UPS)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (data.length) {
      const haveUnread = data.every(i => i.unread)
      if (!haveUnread) setTabViewState({ ...tabViewState, index: 1 })
    }
  }, [data])

  // Effect clear data
  useEffect(() => {
    return () => {
      dispatch({
        type: TYPES.FOLLOW_UPS.CLEAR,
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
        type: TYPES.FOLLOW_UPS.LOAD,
        payload: {
          isLoadMore,
          isRefresh,
          groupId: group.id,
          actionStepsId: actionSteps.id,
        },
      })
    },
    [dispatch],
  )

  const followUps = useMemo(() => {
    if (searchValue && data) {
      return data.filter(
        item =>
          item.content.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.creatorInfo?.name?.toLowerCase().includes(searchValue.toLowerCase()),
      )
    }

    return data
  }, [data, searchValue])

  useEffect(() => {
    handleLoadData(searchValue)
    // Ignore handleLoadData in depsList
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const ids = data?.map(i => (i.unread ? i.id : null))
    dispatch({
      type: TYPES.FOLLOW_UPS.VIEW_ALL,
      payload: {
        ids,
        actionStepId: actionSteps.id,
      },
    })
  }

  const renderItem = ({ item }: { item: FollowUp }) => (
    <SocialActionListingItem
      type={'follow-up-highlight'}
      // @ts-ignore
      info={{ ...item, question: actionSteps.highlightPromptText }}
      actionStepsId={actionSteps.id}
      unreadText={I18n.t('text.View action')}
      isUnread={!!item.unread}
      // messageId={item.id}
      // question={actionSteps.highlightPromptText}
    />
  )

  const renderScene = ({ route }) => {
    let listData = [...followUps]
    if (route.key === 'unread') {
      listData = data?.filter(i => i.unread)
    }
    return (
      <>
        {route.key === 'all' ? (
          <SearchBar placeholder={I18n.t('text.Search for an action')} onSearch={setSearchValue} style={styles.searchBar} />
        ) : listData?.length ? (
          <TouchableOpacity style={styles.markAsReadContainer} onPress={onPressMarkAllAsRead}>
            <Icon style={styles.markAsReadIcon} color={color.accent} source={require('@assets/icons/ic-mark-as-read.png')} size={16} />
            <Subheading color="accent" bold>
              {I18n.t('text.Mark all as read')}
            </Subheading>
          </TouchableOpacity>
        ) : null}

        <FlatList
          style={styles.listWrapper}
          contentContainerStyle={styles.listContentWrapper}
          columnWrapperStyle={styles.listColumnWrapper}
          data={listData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={ItemSeparator}
          numColumns={2}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          ListEmptyComponent={() => {
            if (loadingFollowUps) return <Loading />
            return (
              <EmptyData
                type="textIcon"
                text={route.key === 'unread' ? I18n.t('text.No new action steps') : I18n.t('text.You have no action steps')}
                subText={
                  route.key === 'unread'
                    ? I18n.t('text.Tap the All button to view past action steps')
                    : I18n.t('text.Your group s action steps will appear here')
                }
                image={'🙌'}
                style={styles.emptyData}
                iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
              />
            )
          }}
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
        indicatorStyle={[styles.indicatorStyle, { backgroundColor: color.text }]}
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
        title={`${I18n.t('text.Action steps')} 🙌`}
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
          NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.CREATE_FOLLOW_UP, { actionSteps, hasCompleteAnimation: false })
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
    flex: 1,
  },
  listContentWrapper: {
    marginHorizontal: 16,
    paddingHorizontal: 1,
    paddingBottom: Metrics.safeArea.bottom,
  },
  listColumnWrapper: { justifyContent: 'space-between' },
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
  emptyData: {
    marginTop: '25%',
  },
})

export default FollowUpListing
