import EmptyData from '@components/EmptyData'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import { Subheading } from '@components/Typography'
import { RootState } from '@dts/state'
import useEnhanceThreadData from '@hooks/useEnhanceThreadData'
import useFirestoreThreadSnapshot from '@hooks/useFirestoreThreadSnapshot'
import useTheme from '@hooks/useTheme'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { TYPES } from '@redux/actions'
import ThreadListItem, { ThreadItem } from '@scenes/GroupActions/components/ThreadListItem'
import { Firestore, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

type Props = {
  handleChangeTab: (index: number) => void
}

const UnreadDiscussionList: React.FC<Props> = ({ handleChangeTab }) => {
  const { color } = useTheme()
  const dispatch = useDispatch()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [loadingMarkAsRead, setLoadingMarkAsRead] = useState(false)

  const {
    data: rawData,
    updated,
    action: { loadMore },
    status: { loadingMore, loading: rawLoading },
  } = useFirestoreThreadSnapshot<App.UnreadThread>(
    Firestore.Group.unreadThreadsRef(group.id) as FirebaseFirestoreTypes.CollectionReference,
    {
      direction: 'desc',
      sort: 'threadStartDate',
      limit: 1000,
    },
  )

  const { loading, data } = useEnhanceThreadData(group.id, rawLoading ? undefined : rawData)

  useEffect(() => {
    if (!loading && !data?.length) {
      handleChangeTab(1)
    }
  }, [data?.length, loading])

  const onPressMarkAllAsRead = async () => {
    setLoadingMarkAsRead(true)
    dispatch({
      type: TYPES.GROUP.UPDATE,
      payload: {
        discussionCount: 0,
      },
    })

    if (group.id && data) {
      await Firestore.Group.viewAllThread(group.id, data)
    }
    setLoadingMarkAsRead(false)
  }

  const renderThreadItem = ({ item }) => <ThreadListItem item={item} group={group} type={item.type} />
  const keyThreadExtractor = (item: ThreadItem) => `${item.id.toString()}`
  const getThreadItemLayout = useCallback((_data, index) => ({ length: 220, offset: 220 * index + 12, index }), [])

  if (loadingMarkAsRead || loading) {
    return <Loading />
  }

  return (
    <>
      {data?.length ? (
        <TouchableOpacity style={styles.markAsReadContainer} onPress={onPressMarkAllAsRead}>
          <Icon style={styles.markAsReadIcon} color={color.accent} source={require('@assets/icons/ic-mark-as-read.png')} size={16} />
          <Subheading color="accent" bold>
            {I18n.t('text.Mark all as read')}
          </Subheading>
        </TouchableOpacity>
      ) : null}
      <FlatList
        showsVerticalScrollIndicator={false}
        data={data}
        extraData={updated}
        renderItem={renderThreadItem}
        keyExtractor={keyThreadExtractor}
        onEndReached={debounce(loadMore, 200)}
        getItemLayout={getThreadItemLayout}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListEmptyComponent={
          <EmptyData
            type="textIcon"
            text={I18n.t('text.No new study discussions')}
            subText={I18n.t('Tap the All button to view past discussions')}
            image={'💬'}
            style={styles.emptyData}
            iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
          />
        }
        ListFooterComponent={loadingMore ? <Loading /> : <View style={styles.footer} />}
      />
    </>
  )
}

const styles = StyleSheet.create({
  listHeader: {
    height: 10,
  },
  footer: {
    height: 32,
  },
  emptyData: { marginTop: '25%' },
  markAsReadContainer: {
    alignSelf: 'flex-end',
    marginRight: Metrics.insets.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAsReadIcon: {
    marginRight: 5,
  },
})

export default UnreadDiscussionList
