import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import MemberItem from '@scenes/Onboarding/components/MemberItem'
import { Constants, Metrics } from '@shared/index'
import { sortMember } from '@shared/Utils'
import React, { useContext } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { StudyPreviewContext } from '../StudyPreviewScreen'

const StudyPreviewMembers = () => {
  const context = useContext(StudyPreviewContext)
  const me = useSelector<any, App.User>(s => s.me)
  const navigation = useNavigation<StackNavigationProp<any, any>>()

  const renderItem = ({ item, index }) => {
    const isCurrentUser = me.uid === item.user.id
    let streak = item.user.currentStreak || 0
    if (isCurrentUser) streak = me.currentStreak || 0

    return (
      <MemberItem
        image={item.user.image}
        name={item.user.name}
        isUser={isCurrentUser}
        dayStreak={streak}
        onPress={() => {
          if (item.user.id && me.uid !== item.user.id) navigation.navigate(Constants.SCENES.PRIVATE_CHAT, { user: { id: item.user.id } })
        }}
      />
    )
  }

  const getItemLayout = React.useCallback((_data, index) => ({ length: 80, offset: 80 * index + 10, index }), [])

  if (context.groupMembers !== undefined) {
    return (
      <FlatList
        data={sortMember(context.groupMembers, me.uid)}
        renderItem={renderItem}
        horizontal={false}
        keyExtractor={(item, index) => 'key' + index}
        style={s.containerItem}
        contentContainerStyle={s.contentContainer}
        ListFooterComponent={<View style={{ height: 30 }} />}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
      />
    )
  } else {
    return null
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerItem: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  disabledButton: {
    backgroundColor: '#EFEFEF',
  },
})

export default StudyPreviewMembers
