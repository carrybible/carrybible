import Avatar from '@components/Avatar'
import Container from '@components/Container'
import BottomActions from '@components/Modalize/BottomActions'
import SettingItem from '@components/SettingItem'
import { RootState } from '@dts/state'
import useLoading from '@hooks/useLoading'
import { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { DrawerContentComponentProps } from '@react-navigation/drawer'
import MemberItem from '@scenes/GroupHome/components/MemberItem'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore } from '@shared/index'
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import CodePush from 'react-native-code-push'
import { Portal } from 'react-native-portalize'
import { useSelector } from 'react-redux'
import { H2, Text } from './Typography'

const GroupSlider: React.FC<DrawerContentComponentProps> = props => {
  const { toggleDrawer } = props.navigation
  const { showLoading, hideLoading } = useLoading()
  const handleNavigate = React.useCallback(
    (fn, closeDrawer = true) =>
      (...args: Parameters<typeof fn>): ReturnType<typeof fn> => {
        if (closeDrawer) {
          toggleDrawer()
        }
        return fn(...args)
      },
    [toggleDrawer],
  )

  useEffect(() => {
    const check = async () => {
      CodePush.notifyAppReady()
      devLog('Check update codepush')
      const update = await CodePush.checkForUpdate()
      devLog('codePush', update)
      if (update) {
        const codePushStatusDidChange = syncStatus => {
          switch (syncStatus) {
            case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
              devLog({ syncMessage: 'Checking for update.' })
              break
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
              devLog({ syncMessage: 'Downloading package.' })
              break
            case CodePush.SyncStatus.AWAITING_USER_ACTION:
              devLog({ syncMessage: 'Awaiting user action.' })
              break
            case CodePush.SyncStatus.INSTALLING_UPDATE:
              devLog({ syncMessage: 'Installing update.' })
              break
            case CodePush.SyncStatus.UP_TO_DATE:
              devLog({ syncMessage: 'App up to date.', progress: false })
              break
            case CodePush.SyncStatus.UPDATE_IGNORED:
              devLog({ syncMessage: 'Update cancelled by user.', progress: false })
              break
            case CodePush.SyncStatus.UPDATE_INSTALLED:
              devLog({ syncMessage: 'Update installed and will be applied on restart.', progress: false })
              break
            case CodePush.SyncStatus.UNKNOWN_ERROR:
              devLog({ syncMessage: 'An unknown error occurred.', progress: false })
              break
          }
        }

        const codePushDownloadDidProgress = progress => {
          devLog(progress)
          showLoading(
            I18n.t('text.Downloading', {
              percent: `${((progress.receivedBytes / progress.totalBytes) * 100).toFixed(2)}`,
            }),
          )
        }

        CodePush.sync(
          { installMode: CodePush.InstallMode.IMMEDIATE, updateDialog: true },
          codePushStatusDidChange,
          codePushDownloadDidProgress,
        ).finally(() => {
          hideLoading()
        })
      }
    }

    check()
  }, [])

  return (
    <Container safe>
      <ScreenView scrollable={{ left: true }} separateHorizontal separateVertical>
        <Settings handleNavigate={handleNavigate} />
        <GroupMembers handleNavigate={handleNavigate} />
      </ScreenView>
    </Container>
  )
}

const Settings = ({ handleNavigate }) => {
  const { typography, color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const shouldRenderGroupSettings = !!group.id
  const { showLoading, hideLoading } = useLoading()

  const shouldShowWeeklyReview = useMemo(
    () => group.created?.seconds && Math.abs(differenceInDays(group.created.seconds * 1000, Date.now())) >= 7,
    [group.created?.seconds],
  )

  return (
    <View>
      <View style={styles.settingInfo}>
        <View>
          <Avatar url={group.image} size={50} style={styles.avatar} touchable={false} />
        </View>
        <View style={styles.flex1}>
          {shouldRenderGroupSettings && <H2 numberOfLines={3}>{group.name}</H2>}
          <TouchableOpacity onPress={handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.LAUNCH.BIBLE_GROUPS))}>
            <Text
              style={{
                fontSize: typography.footnote,
                color: color.accent,
              }}>
              {I18n.t('text.Switch group')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingsWrapper}>
        {shouldRenderGroupSettings && group.channel && (
          <SettingItem
            icon="settings"
            text={I18n.t('text.Group settings')}
            onPress={handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.GROUP.SETTINGS))}
          />
        )}
        {shouldRenderGroupSettings && (
          <SettingItem
            icon="user-plus"
            text={I18n.t('text.Invite members')}
            onPress={handleNavigate(() => {
              NavigationRoot.push(Constants.SCENES.GROUP.SHARE, { groupId: group.id })
            })}
          />
        )}
        <SettingItem
          icon="user"
          text={I18n.t('text.Profile settings')}
          onPress={handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.ACCOUNT_SETTINGS))}
        />
        {!group.isOwner && shouldShowWeeklyReview && (
          <SettingItem
            icon={require('@assets/icons/review.png')}
            text={I18n.t('text.Weekly review')}
            onPress={handleNavigate(async () => {
              try {
                showLoading()
                const weeklyReviewData = await Firestore.Group.getWeeklyReview(group.id)
                hideLoading()
                NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.WEEKLY_REVIEW, {
                  weeklyReviewData,
                })
                // @ts-ignore
              } catch (e: Error) {
                hideLoading()
                toast.error(e.message)
              }
            })}
          />
        )}
        {group.isOwner && (
          <SettingItem
            icon="tool"
            text={I18n.t('text.Leader tools')}
            onPress={handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.LEADER_TOOLS))}
          />
        )}
        {/* {group.org?.giving?.allowSetup && group.org?.giving?.isConnected ? (
          <SettingItem
            icon="credit-card"
            text={I18n.t('text.Giving settings')}
            onPress={handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.GIVING.SETTINGS))}
          />
        ) : null} */}
      </View>
    </View>
  )
}

const GroupMembers = ({ handleNavigate }) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const actionsModalRef = useRef<{ open: (item: any) => void }>()
  const [currentUser, setCurrentUser] = useState<App.User>()
  const renderItem = React.useCallback(
    ({ item }) => {
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
          // @ts-ignore
          isOwner={user.id === group.owner}
          size={36}
          name={user.name}
          lastActive={user.last_active}
          onlineTime={
            user.online
              ? I18n.t('text.Active')
              : user?.last_active
              ? formatDistanceToNowStrict(new Date(user.last_active || undefined), {
                  locale: global.locale,
                  addSuffix: false,
                })
              : ''
          }
          score={group.isOwner ? group.score?.[user.id]?.total : undefined}
          onPress={() => {
            setCurrentUser(user)
            actionsModalRef.current?.open(item)
          }}
        />
      )
    },
    // @ts-ignore
    [group.score, me.uid, group.owner, group.isOwner],
  )
  const deleteMember = async id => {
    try {
      NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
        title: I18n.t('text.Confirm'),
        description: I18n.t('text.Are you sure you want to delete this member'),
        confirmTitle: I18n.t('text.Yes'),
        cancelTitle: I18n.t('text.Cancel'),
        onConfirm: async () => {
          const success = await Firestore.Group.deleteMember({ groupId: group?.id, memberId: id, type: 'remove' })
          if (success) toast.success(I18n.t('text.Member removed'))
        },
      })
    } catch (e) {
      toast.error(I18n.t('error.Can not remove member'))
    }
  }
  const handleMemberActions = (action, item) => {
    switch (action) {
      case 'chat':
        handleNavigate(() => NavigationRoot.navigate(Constants.SCENES.PRIVATE_CHAT, { user: item.user }))()
        break
      case 'delete':
        deleteMember(item.user.id)
        break
    }
  }

  if (!group.id || !group.channel) {
    return null
  }
  return (
    <View style={styles.groupMemberWrapper}>
      <Text color="gray2" style={styles.groupMemberText}>
        {I18n.t('text.Group members')}
      </Text>
      <FlatList
        // @ts-ignore
        data={sortMember(group.channelMembers, group.owner, me.uid)}
        renderItem={renderItem}
        horizontal={false}
        keyExtractor={(item: any, index: number) => {
          return `${item?.user?.id || index}`
        }}
        style={styles.groupMemberList}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
      <Portal>
        <BottomActions
          // @ts-ignore
          ref={actionsModalRef}
          headerStyle={styles.bottomActionHeader}
          HeaderComponent={({ user }) => (
            <MemberItem
              image={user.image}
              isOnline={user.online}
              size={46}
              name={user.name}
              onlineTime={user.online ? I18n.t('text.Active') : ''}
              type="mini"
            />
          )}
          actions={[
            ...(currentUser?.id !== me.uid
              ? [{ title: I18n.t('text.Send message'), color: 'accent', icon: 'message-circle', action: 'chat' }]
              : []),
            ...(group.isOwner && group.owner !== currentUser?.id
              ? [{ title: I18n.t('text.Remove from group'), color: 'red', icon: 'x', action: 'delete' }]
              : []),
          ]}
          onActionPress={handleMemberActions}
        />
      </Portal>
    </View>
  )
}

function sortMember(users: Array<any>, ownerUid: string, meUid: string) {
  const me = _.find(users, u => u.user.id === meUid)
  const owner = _.find(users, u => u.user.id === ownerUid)
  const theRest = _.filter(users, u => u.user.id !== ownerUid && u.user.id !== meUid)
  const sortedRest = theRest.sort((a, b) => {
    const nameA = a.user.name || 'Z'
    const nameB = b.user.name || 'Z'
    return nameA.localeCompare(nameB)
  })
  const topOfList = [me]
  if (ownerUid !== meUid) {
    topOfList.push(owner)
  }
  return [...topOfList, ...sortedRest]
}

const styles = StyleSheet.create({
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  settingsWrapper: {
    paddingHorizontal: 25,
  },
  avatar: {
    marginRight: 15,
  },
  bottomActionHeader: {
    height: 120,
  },
  groupMemberWrapper: {
    flex: 1,
    paddingTop: 37,
  },
  groupMemberText: {
    marginBottom: 5,
    marginHorizontal: 21,
  },
  groupMemberList: {
    flex: 1,
    width: '100%',
  },
  flex1: {
    flex: 1,
  },
})

export default GroupSlider
