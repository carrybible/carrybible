import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import ActionSteps from '@dts/actionSteps'

import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'

import I18n from 'i18n-js'
import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import EmptyData from '@components/EmptyData'
import Loading from '@components/Loading'
import SearchBar from '@components/SearchBar'
import { useIsFocused } from '@react-navigation/native'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import ActionStepItem from './components/ActionStepItem'

const ActionStepsScreen = () => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const Analytics = useAnalytic()
  const dispatch = useDispatch()
  const { color } = useTheme()
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { data, loadingActionSteps } = useSelector<RootState, RootState['actionSteps']>(state => state.actionSteps)
  const isFocus = useIsFocused()

  // Effect load data
  const handleLoadData = React.useCallback(
    (
      searchText = '',
      options = {
        isLoadMore: false,
        isRefresh: false,
      },
    ) => {
      const { isLoadMore, isRefresh } = options
      dispatch({
        type: TYPES.ACTION_STEPS.LOAD,
        payload: {
          isLoadMore,
          isRefresh,
          groupId: group.id,
        },
      })
    },
    [dispatch, group.id],
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await handleLoadData(searchText, { isRefresh: true, isLoadMore: false })
    setRefreshing(false)
  }
  const handleLoadMore = async () => {
    await handleLoadData(searchText, { isRefresh: false, isLoadMore: true })
  }

  const keyExtractor = item => item.id

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ACTIONS_STEP.VIEW_ALL_ACTION_STEPS)
  }, [])

  useEffect(() => {
    if (isFocus) handleLoadData(searchText, { isLoadMore: false, isRefresh: true })
  }, [isFocus])

  useEffect(() => {
    return () => {
      dispatch({
        type: TYPES.ACTION_STEPS.CLEAR,
      })
    }
  }, [dispatch, handleLoadData])

  const renderItem = ({ item }: { item: ActionSteps }) => <ActionStepItem item={item} unread={item.unreadCount ?? 0} />

  const steps = useMemo(() => {
    if (searchText && data) {
      return data.filter(item => item.actionText.toLowerCase().includes(searchText.toLowerCase()))
    }
    return data
  }, [data, searchText])

  return (
    <Container key={group.id} safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        title={`${I18n.t('text.Action steps')} 🙌`}
        colorLeft={color.text}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <SearchBar placeholder={I18n.t('text.Search for an action')} onSearch={setSearchText} style={styles.searchBar} />
      <FlatList
        data={steps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        refreshing={refreshing}
        ListEmptyComponent={() => {
          if (loadingActionSteps) return <Loading />
          return (
            <EmptyData
              type="textIcon"
              text={I18n.t('text.You have no action steps')}
              subText={I18n.t('text.Your group s action steps will appear here')}
              image={'🙌'}
              style={styles.emptyData}
              iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
            />
          )
        }}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    marginTop: 22,
    marginBottom: 4,
  },
  emptyData: {
    marginTop: '25%',
  },
})

export default ActionStepsScreen
