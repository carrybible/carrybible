import Container from '@components/Container'
import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'
import { LoadingErrorIndicator, LoadingIndicator } from '@components/StreamIO'
import DirectMessageItem from '@components/StreamIO/DirectMessageItem'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { ChannelList, Chat } from 'stream-chat-react-native'
import { Constants } from '@shared/index'
import SearchBar from '@components/SearchBar'

const DirectMessageScreen = () => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const [searchUserName, setSearchUserName] = useState('')

  const filters = React.useMemo(() => {
    if (!group?.id || !me?.uid) return
    const listMemberExceptMe = group.members?.filter(member => member !== me.uid)
    return {
      type: 'messaging',
      members: { $in: [me.uid] },
      member_count: { $eq: 2 },
      id: {
        $nin: [...ids, group.id], // just in case the group just created and this ids list is not updated
      },
      groupId: { $eq: group.id },
      ...(!listMemberExceptMe || listMemberExceptMe.length === 0
        ? {}
        : {
            $and: [
              {
                members: { $in: listMemberExceptMe },
              },
            ],
          }),
      ...(searchUserName
        ? {
            'member.user.name': {
              $autocomplete: searchUserName,
            },
          }
        : {}),
    }
  }, [group.id, group.members, ids, me.uid, searchUserName])

  if (!group?.id || !me?.uid) {
    return null
  }

  return (
    <Container key={group.id} safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        title={I18n.t('text.Direct Messages')}
        iconRight={'edit'}
        colorLeft={color.text}
        iconRightSize={22}
        colorRight={color.text}
        onPressRight={() => {
          NavigationRoot.navigate(Constants.SCENES.NEW_MESSAGE)
        }}
        borderedBottom
        borderedBottomGradient
      />
      <SearchBar placeholder={I18n.t('text.Search direct message')} onSearch={setSearchUserName} style={styles.searchBar} />
      <View style={styles.flex1}>
        {!!me?.uid && (
          <Chat
            key={group.directMsgRenderCount}
            // @ts-ignore
            client={StreamIO.client}
            i18nInstance={StreamIO.streamI18n}
            style={color.chat}>
            <ChannelList
              key={group.directMsgRenderCount}
              // @ts-ignore
              filters={filters}
              options={{
                state: true,
                watch: true,
                presence: true,
              }}
              // @ts-ignore
              Preview={DirectMessageItem}
              HeaderNetworkDownIndicator={() => null}
              EmptyStateIndicator={() => (
                <EmptyData
                  type="textIcon"
                  image="✉️"
                  iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
                  style={styles.emptyWrapper}
                  imgStyle={styles.emptyImgStyle}
                  subtextStyle={styles.emptySubtext}
                  text={I18n.t('text.You have no messages')}
                  subText={I18n.t('text.Create a message and say hello to a group member')}
                />
              )}
              LoadingErrorIndicator={LoadingErrorIndicator}
              LoadingIndicator={LoadingIndicator}
              additionalFlatListProps={{
                ListHeaderComponent: () => <View style={styles.listHeader} />,
              }}
            />
          </Chat>
        )}
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    marginTop: 22,
    marginBottom: 4,
  },
  flex1: {
    flex: 1,
  },
  emptyWrapper: {
    marginTop: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  emptyImgStyle: {
    marginBottom: 10,
    width: 135,
    height: 135,
    flexGrow: undefined,
  },
  emptySubtext: {
    marginTop: 10,
    width: '60%',
  },
  listHeader: {
    height: 10,
  },
})

export default DirectMessageScreen
