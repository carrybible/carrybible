import Avatar from '@components/Avatar'
import JumpingAvatars from '@components/JumpingAvatars'
import { Subheading, Text } from '@components/Typography'
import Color from '@dts/color'
import { GroupActionsType } from '@dts/groupAction'
import { RootState } from '@dts/state'
import { NavigationRoot } from '@scenes/root'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Dispatch } from 'redux'
import Constants from './Constants'
import { TYPES } from '@redux/actions'

export const showRequestReviewPrompts: (props: {
  type: GroupActionsType
  actions: RootState['group']['groupActions']
  channelMembers: RootState['group']['channelMembers']
  color: Color
  dispatch: Dispatch
}) => void = ({ type, actions, channelMembers, color, dispatch }) => {
  dispatch({
    type: TYPES.GROUP_ACTIONS.LOAD,
    payload: {
      type,
      isLoadMore: false,
      isRefresh: false,
    },
  })

  let message = ''
  const getFirstName = (name = '') => name.split(' ')?.[0] || ''

  const listCreator: string[] = actions[type].data.map(value => value.creator)
  const members = channelMembers.filter(member => listCreator.includes(member.user_id))
  const actionText = type === 'prayer' ? 'requested prayer' : 'shared gratitude'

  if (members.length > 3) {
    message = `${getFirstName(members[0].user.name)}, ${getFirstName(members[1].user.name)}, and ${members.length - 2} others ${actionText}`
  } else if (members.length === 3) {
    message = `${getFirstName(members[0].user.name)}, ${getFirstName(members[1].user.name)}, and ${getFirstName(
      members[2].user.name,
    )} ${actionText}`
  } else if (members.length === 2) {
    message = `${getFirstName(members[0].user.name)} and ${getFirstName(members[1].user.name)} ${actionText}`
  } else {
    message = `${getFirstName(members[0].user.name)} ${actionText}`
  }

  NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
    titleIcon: <Text style={styles.titleIcon}>{type === 'prayer' ? '🙏' : '🎉'}</Text>,
    title:
      type === 'prayer'
        ? I18n.t('text.Do you have a few minutes to pray')
        : I18n.t('text.Do you have a few minutes to celebrate with your group'),
    customContent: (
      <View style={styles.alignCenter}>
        <JumpingAvatars
          jumpHeight={6}
          delayTime={200}
          duration={700}
          itemSize={26}
          data={members.slice(0, 5).map(member => {
            return <Avatar url={member.user.image} size={26} borderColor={color.background} borderWidth={1.5} touchable={false} />
          })}
        />
        <Subheading style={styles.message} color={'gray'}>
          {message}
        </Subheading>
      </View>
    ),
    confirmTitle: type === 'prayer' ? I18n.t('text.View all prayers') : I18n.t('text.View all entries'),
    cancelTitle: I18n.t('text.Maybe later'),
    onConfirm: () => {
      NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.DETAIL, {
        mode: 'unread',
        initGroupActionId: actions[type].data[0].id,
      })
    },
    onCancel: async () => undefined,
  })
}

const styles = StyleSheet.create({
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
  alignCenter: { alignItems: 'center' },
  message: { marginTop: 10 },
})
