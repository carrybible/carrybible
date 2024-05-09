import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import Avatar from '@components/Avatar'
import Text from '@components/Typography/Text'
import useTheme from '@hooks/useTheme'
import { Constants, Metrics, Styles } from '@shared/index'
import { RootState } from '@dts/state'
import { NavigationRoot } from '@scenes/root'
import useScreenMode from '@hooks/useScreenMode'

export type ActivityItemInfoType = NonNullable<RootState['groupActions']['data']>[number]

type Props = {
  info: ActivityItemInfoType
  isUnread: boolean
  unreadText: string
  onPress?: () => void
  type?: 'follow-up-highlight' | null
  actionStepsId?: string
}

const SocialActionListingItem: React.FC<Props> = ({ info, unreadText, isUnread, type, actionStepsId }) => {
  const { id, content } = info
  const { color, typography } = useTheme()
  const { landscape } = useScreenMode()
  return (
    <TouchableOpacity
      style={[
        landscape ? styles.landWrapper : styles.wrapper,
        {
          backgroundColor: color.background,
        },
        color.id === 'dark' ? styles.darkThemeShadow : Styles.shadow,
        // eslint-disable-next-line react-native/no-inline-styles
        isUnread && { borderWidth: 1, borderColor: color.accent },
      ]}
      onPress={() => {
        if (type === 'follow-up-highlight') {
          NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.FOLLOW_UP_ACTIVITY, {
            info,
            actionStepsId: actionStepsId,
          })
        } else {
          NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.DETAIL, {
            mode: info.unread ? 'unread' : 'read',
            initGroupActionId: id,
          })
        }
      }}>
      <View style={styles.infoWrapper}>
        <View style={styles.personalInfo}>
          <Avatar url={info.creatorInfo?.image || ''} size={32} touchable={false} />
          <Text style={[styles.nameText, { fontSize: typography.small }]} numberOfLines={1}>
            {info.creatorInfo?.name || ''}
          </Text>
        </View>
        <Text numberOfLines={3} style={[styles.contentText, { fontSize: typography.footnote }]}>
          {content}
        </Text>
      </View>

      <View style={[styles.unreadSection, isUnread && { backgroundColor: color.accent }]}>
        {isUnread && (
          <Text numberOfLines={1} align={'center'} style={{ color: color.white, fontSize: typography.small }} bold>
            {unreadText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  landWrapper: {
    borderRadius: 11,
    width: (Metrics.screen.height - 10.5 * 8) / 4,
    minHeight: 170,
  },
  wrapper: {
    borderRadius: 11,
    width: (Metrics.screen.width - 42) / 2,
    minHeight: 170,
  },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  infoWrapper: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 9,
  },
  personalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nameText: {
    marginLeft: 5,
  },
  contentText: {
    marginTop: 10,
    fontWeight: '500',
  },
  unreadSection: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    height: 30,
  },
})

export default SocialActionListingItem
