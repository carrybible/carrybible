import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import { H3, Subheading, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { FC, useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

export type ThreadItem = App.Thread & {
  plan: StudyPlan.GroupPlan
}

interface Props {
  item: ThreadItem
  group: RootState['group']
  type?: 'goal' | 'thread'
}

const ThreadListItem: FC<Props> = ({ item, type, group }) => {
  const Analytics = useAnalytic()
  const { color, typography } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)

  const onPress = () => {
    Firestore.Group.updateThreadViewer(group.id, item.id, item.replyCount)
    NavigationRoot.navigate(Constants.SCENES.GROUP.DISCUSS_THREAD, {
      threadId: item.id,
      groupId: group.id,
    })
    Analytics.event(type === 'goal' ? Constants.EVENTS.GROUP.TAPPED_THREAD_GOAL : Constants.EVENTS.GROUP.TAPPED_THREAD_ITEM)
  }

  const unreadMessageCount = useMemo(() => {
    const readMessageCount = (item.viewers?.length && item.viewers.find(i => i.id === me.uid)?.last_reply_count) || 0
    return item.replyCount - readMessageCount
  }, [item.replyCount, item.viewers, me.uid])

  const listUserAvatars = useMemo(() => {
    return _.chain<Array<App.User>>(item.participants)
      .sortBy('last_active')
      .take(5)
      .map((u: App.User) => {
        if (u.id === item.creator.id) return null
        return <Avatar key={`${u.id}`} url={u.image} size={18} style={s.readUserAvatar} />
      })
      .value()
  }, [item.creator.id, item.participants])

  return (
    <TouchableOpacity
      style={[
        s.container,
        { backgroundColor: color.middle },
        unreadMessageCount ? s.unreadMessageContainer : {},
        unreadMessageCount ? { borderColor: color.accent } : {},
      ]}
      activeOpacity={0.8}
      onPress={onPress}>
      <View style={[s.planInfoWrapper, { borderColor: color.gray5 }]}>
        <Avatar url={item.plan.featuredImage || group.image} size={40} />
        <View style={s.planInfo}>
          <H3 color="black2" numberOfLines={1}>
            {item.plan.name}
          </H3>
          <Subheading bold={false} color="gray" numberOfLines={1}>{`${I18n.t('text.Day')} ${item.blockIndex} | ${
            item.plan.blocks[(item.blockIndex || 1) - 1]?.name ?? ''
          }`}</Subheading>
        </View>
      </View>

      <Text numberOfLines={2} style={s.text}>
        {item.text}
      </Text>

      <View style={s.avatars}>
        {type === 'goal' ? (
          <Icon source="flag" color={color.text} size={22} style={[{ backgroundColor: color.gray7 }, s.flagIcon]} />
        ) : (
          <Avatar url={item.creator.image} size={18} style={[{ backgroundColor: color.gray7 }, s.avatar]} />
        )}
        {listUserAvatars}
      </View>

      <View style={s.footer}>
        {!unreadMessageCount ? (
          <Subheading color="gray">
            {item.replyCount === 1
              ? I18n.t('params.reply', { valCount: item.replyCount })
              : item.replyCount > 1
              ? I18n.t('params.replies', { valCount: item.replyCount })
              : ''}
          </Subheading>
        ) : Math.abs(unreadMessageCount) > 0 ? (
          <Subheading color="accent" bold>
            {Math.abs(unreadMessageCount)} {Math.abs(unreadMessageCount) > 1 ? I18n.t('text.new replies') : I18n.t('text.new reply')}
          </Subheading>
        ) : null}
      </View>
      {unreadMessageCount ? (
        <View style={[s.viewDisscussionContainer, { backgroundColor: color.accent }]}>
          <Text color="middle" style={[s.discussionText, { fontSize: typography.small }]}>
            {I18n.t('text.View discussion')}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

ThreadListItem.defaultProps = {}

const s = StyleSheet.create({
  container: {
    minHeight: 138,
    marginHorizontal: Metrics.insets.horizontal,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingBottom: 13,
    paddingTop: 8,
    borderRadius: 15,
    ...Styles.shadow,
    marginBottom: 12,
  },
  unreadMessageContainer: {
    borderWidth: 1,
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDisscussionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 13,
    marginBottom: -13,
    height: 38,
    marginHorizontal: -Metrics.insets.horizontal,
    borderBottomStartRadius: 8,
    borderBottomEndRadius: 8,
  },
  discussionText: { fontWeight: '500' },
  text: {
    marginVertical: 10,
    fontWeight: '600',
  },
  flagIcon: { padding: 7, borderRadius: 18, overflow: 'hidden' },
  avatar: { borderRadius: 18 },
  readUserAvatar: { marginLeft: 3 },
  planInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  planInfo: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
})

export default React.memo(
  ThreadListItem,
  (p, n) =>
    p.item.updated === n.item.updated && p.type === n.type && p.item.text === n.item.text && p.item.replyCount === n.item.replyCount,
)
