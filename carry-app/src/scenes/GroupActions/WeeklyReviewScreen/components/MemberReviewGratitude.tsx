import Avatar from '@components/Avatar'
import GroupMemberAvatars from '@components/GroupMemberAvatars'

import { H1, Text } from '@components/Typography'
import GroupActions from '@dts/groupAction'
import { RootState } from '@dts/state'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

type Props = {
  groupAction: GroupActions
}

const MemberReviewGratitude: React.FC<Props> = ({ groupAction }) => {
  const { landscape } = useScreenMode()
  return (
    <View style={styles.wrapper}>
      <ScreenView scrollable={{ right: true }}>
        <View style={landscape ? styles.flex : styles.center}>
          <H1 align="center" style={styles.headerTitle}>
            {I18n.t('text.Check out who celebrated with you this week')}
          </H1>
        </View>
        <View style={landscape ? styles.flex : styles.center}>
          <GroupActionPreview groupAction={groupAction} />
          <GroupMemberAvatars
            avatarSize={36}
            userIds={groupAction.reactedUserIds ?? []}
            avatarBorderSize={2}
            fontSize={14}
            style={styles.groupAvatar}
          />
        </View>
      </ScreenView>
    </View>
  )
}

const GroupActionPreview = ({ groupAction }: { groupAction: GroupActions }) => {
  const { typography, color } = useTheme()
  const { content } = groupAction
  const { landscape } = useScreenMode()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  return (
    <View
      style={[
        color.id === 'light' ? Styles.shadow : Styles.shadowDark,
        styles.groupActionPreviewWrapper,
        { backgroundColor: color.background },
        landscape ? styles.removeMargin : {},
      ]}>
      <View style={styles.info}>
        <Avatar size={35} url={me.image} touchable={false} />
        <Text style={[{ fontSize: typography.subhead }, styles.nameText]}>{me.name}</Text>
      </View>
      <View>
        <Text style={[{ fontSize: typography.body }, styles.content]}>{content}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    marginTop: 20,
  },
  groupActionPreviewWrapper: {
    borderRadius: 13,
    width: '60%',
    marginTop: 100,
    paddingHorizontal: 15,
    paddingVertical: 40,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  nameText: {
    flex: 1,
    marginLeft: 10,
  },
  content: {
    marginBottom: 20,
  },
  groupAvatar: { marginTop: 17 },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  removeMargin: {
    marginTop: 0,
  },
  center: { width: Metrics.screen.width, alignItems: 'center' },
})

export default MemberReviewGratitude
