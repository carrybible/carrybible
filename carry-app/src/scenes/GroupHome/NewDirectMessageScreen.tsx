import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import Icon from '@components/Icon'
import TextField from '@components/TextField'
import { H3 } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { Constants, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { useMemo, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { ChannelMemberResponse } from 'stream-chat'
import MemberItem from './components/MemberMsgItem'

function sortMember(users: Record<string, ChannelMemberResponse<any>>, ownerUid: string) {
  const theRest = _.filter(users, u => u?.user?.id !== ownerUid)
  const sortedRest = theRest.sort((a, b) => {
    const nameA = a.user.name || 'Z'
    const nameB = b.user.name || 'Z'
    return nameA.localeCompare(nameB)
  })
  return [...sortedRest]
}

const NewDirectMessageScreen = () => {
  const { color } = useTheme()
  const theme = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { channel } = group
  const me = useSelector<any, App.User>(state => state.me)
  const [searchText, setSearchText] = useState<string>('')

  const getItemLayout = React.useCallback((_data, index) => ({ length: 75, offset: 75 * index + 10, index }), [])

  const renderItem = React.useCallback(({ item }) => {
    if (!item?.user) {
      return null
    }

    const { user } = item
    return (
      <MemberItem
        image={user.image}
        currentStreak={user.currentStreak}
        isOnline={user.online}
        isCurrentUser={user.id === me.uid}
        size={56}
        name={user.name}
        readingPosition={user.reading}
        lastActive={user.last_active}
        onPress={() => {
          NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, {
            user: user,
          })
        }}
      />
    )
  }, [])

  const memberList = useMemo(() => {
    return sortMember(channel?.state?.members || [], me.uid)
  }, [channel])

  return (
    <Container safe={true} style={s.pageContainer}>
      <HeaderBar
        title={I18n.t('text.New message')}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        borderedBottom={true}
      />
      <View style={s.searchWrapper}>
        <H3>{`${I18n.t('text.To')}:`}</H3>
        <View style={s.searchContainer}>
          <View style={[s.input, s.searchInputWrapper, { backgroundColor: theme.color.gray7 }]}>
            <Icon source={'search'} size={24} color={theme.color.text} style={s.searchIcon} />
            <TextField
              id="name"
              placeholder={I18n.t('text.Search by name')}
              numberOfLines={1}
              maxLength={40}
              value={searchText}
              onChangeText={(id, value) => {
                setSearchText(value)
              }}
              autoFocus={true}
              placeholderWeight="500"
              returnKeyType="search"
              style={s.searchTextInput}
              containerStyle={[s.input__container]}
            />
            {searchText ? (
              <TouchableOpacity
                // style={{ zIndex: 2, paddingLeft: 10 }}
                onPress={() => {
                  setSearchText('')
                }}>
                <Icon source={require('@assets/icons/ic-search-clear.png')} color={theme.color.text} size={20} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      <H3 style={s.memberText}>{I18n.t('text.Members')}</H3>
      <FlatList
        getItemLayout={getItemLayout}
        contentContainerStyle={s.listContentStyle}
        data={memberList.filter(value => {
          if (!searchText) return true
          const name = value?.user?.name || ''
          if (name.toLowerCase().includes(searchText?.toLowerCase() || '')) return true
          return false
        })}
        renderItem={renderItem}
        horizontal={false}
        keyExtractor={(item: any, index: number) => {
          return `${item?.user?.id || index}`
        }}
        style={s.container}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  )
}

NewDirectMessageScreen.defaultProps = {}

const s = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  input__container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
  },
  input: {
    borderRadius: 19.5,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    height: 39,
  },
  searchIcon: { marginRight: 0 },
  searchWrapper: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Metrics.insets.horizontal,
    paddingHorizontal: Metrics.insets.horizontal + 2,
  },
  searchTextInput: { margin: 0, padding: 0, borderWidth: 0, backgroundColor: 'transparent' },
  pageContainer: { paddingTop: 0 },
  memberText: { marginLeft: 20 },
  listContentStyle: { paddingVertical: 10 },
})

export default React.memo(NewDirectMessageScreen)
