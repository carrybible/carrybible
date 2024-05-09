import Avatar from '@components/Avatar'
import ConfirmDeleteAccount from '@components/ConfirmDeleteAccount'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import SettingItem from '@components/SettingItem'
import { H2, H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { useOTAVersion } from '@hooks/useCodepushVersion'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { Config, Constants, Firestore } from '@shared/index'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useRef } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ AccountSetting: ParamProps }, 'AccountSetting'>

const AccountSettingScreen: React.FC<Props> = () => {
  const dispatch = useDispatch()
  const { appVersion } = useOTAVersion()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)
  const { color, changeTheme } = useTheme()
  const deleteAccountRef = useRef<{ show: () => void; handleIndexChange: (number) => void; close: () => void }>(null)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const darkMode = color.id === 'dark'
  const { showLoading, hideLoading } = useLoading()

  const handleChangeReminderTime = () => {
    NavigationRoot.navigate(Constants.SCENES.GROUP.REMINDER)
  }

  const updateTheme = () => {
    const newTheme = darkMode ? 'light' : 'dark'
    changeTheme(newTheme)
    Firestore.Auth.updateUser({ theme: newTheme })
  }

  const logout = async () => {
    try {
      showLoading()
      await Firestore.Auth.logout()
    } catch (err) {
      devLog('error logout', err)
    }

    hideLoading()
    dispatch({ type: TYPES.ME.LOGOUT })
    NavigationRoot.login()
  }

  const handleDeleteUser = async () => {
    try {
      global.DELETING_USER = true
      showLoading()
      const { success, message } = await Firestore.Auth.deleteUser()
      // Only need to delete auth of User, everything else will handle on Functions
      if (!success && message === 're-login') {
        deleteAccountRef.current?.handleIndexChange(1)
      } else if (!success && message) {
        toast.error(message)
      } else {
        global.USER_DELETED = true
        deleteAccountRef.current?.close()
        dispatch({ type: TYPES.ME.LOGOUT })
        NavigationRoot.login()
      }
    } catch (err) {
      devLog('error logout', err)
      toast.error(I18n.t('error.Failed to delete account Please try again later'))
    }

    global.DELETING_USER = false
    hideLoading()
  }

  const handleLoginAndDeleteUser = async () => {
    try {
      global.DELETING_USER = true
      showLoading()

      // Wait for onUpdate group firebase function to trigger to clean up all the user
      await wait(3000)
      const { success, message } = await Firestore.Auth.deleteUserWithNewCredential()

      if (!success && message) {
        devLog('handleLoginAndDeleteUser', message)
        hideLoading()
        global.DELETING_USER = false
        return
      }
      await Promise.all(ids.map(groupId => Firestore.Group.deleteMember({ groupId: groupId, memberId: me.uid })))
      global.USER_DELETED = true
      deleteAccountRef.current?.close()
      dispatch({ type: TYPES.ME.LOGOUT })
      NavigationRoot.login()
    } catch (err) {
      devLog('error logout', err)
      toast.error(I18n.t('error.Failed to delete account Please try again later'))
    }

    global.DELETING_USER = false
    hideLoading()
  }

  return (
    <>
      <Container safe>
        <HeaderBar
          title={I18n.t('text.Profile settings')}
          iconLeft={'chevron-thin-left'}
          iconLeftFont={'entypo'}
          colorLeft={color.text}
          iconLeftSize={22}
          onPressLeft={() => {
            NavigationRoot.pop()
          }}
        />
        <ScrollView style={styles.settingWrapper} alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
          <UserInfo />

          <SettingItem
            icon="user"
            text={I18n.t('text.Update profile')}
            onPress={() => {
              if (group.org && group.org?.isRequirePhone && !me.phoneNumber) {
                NavigationRoot.navigate(Constants.SCENES.COMMON.CONNECT_WITH_ORG, {
                  isEditProfile: true,
                })
              } else {
                NavigationRoot.navigate(Constants.SCENES.COMMON.UPDATE_PROFILE)
              }
            }}
          />
          <SettingItem
            icon="clock"
            text={I18n.t('text.Change reminder time')}
            onPress={() => {
              handleChangeReminderTime()
            }}
          />
          <SettingItem
            icon="book-open"
            text={I18n.t('text.Change Bible translation')}
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.COMMON.TRANSLATION)
            }}
          />
          <SettingItem
            icon={require('@assets/images/translate-icon.png')}
            text={I18n.t('text.Change language')}
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.COMMON.LANGUAGE)
            }}
          />
          {Config.VARIANT === 'carry' ? (
            <SettingItem
              icon={darkMode ? 'sun' : 'moon'}
              text={darkMode ? I18n.t('text.Change to light mode') : I18n.t('text.Change to dark mode')}
              onPress={() => {
                updateTheme()
              }}
            />
          ) : null}
          <SettingItem
            icon={'alert-circle'}
            text={I18n.t('text.Report a Bug')}
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.MODAL.REPORT)
            }}
          />
          <SettingItem
            icon={'message-square'}
            text={I18n.t('text.Send us feedback')}
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.MODAL.REPORT, { type: 'feedback' })
            }}
          />
          <SettingItem
            icon="log-out"
            text={I18n.t('text.Sign out')}
            onPress={() => {
              Smartlook.trackCustomEvent(CUSTOM_EVENTS.LOG_OUT, { reason: 'Manual logout' })
              logout()
            }}
          />
          <SettingItem
            icon="x"
            text={I18n.t('text.Delete account')}
            tintColor={color.red}
            textColor={color.red}
            onPress={() => {
              deleteAccountRef.current?.show()
            }}
          />

          <Text style={styles.info}>{appVersion}</Text>
        </ScrollView>
      </Container>
      {/*@ts-ignore*/}
      <ConfirmDeleteAccount ref={deleteAccountRef} onConfirm={handleDeleteUser} onLoginAndDelete={handleLoginAndDeleteUser} />
    </>
  )
}

const UserInfo: React.FC = () => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { color } = useTheme()
  return (
    <View
      style={[
        styles.userInfo,
        {
          borderBottomColor: color.gray5,
        },
      ]}>
      <Avatar
        url={me.image}
        size={80}
        borderWidth={3}
        borderColor={'#EDEEF3'}
        onPress={() => {
          NavigationRoot.navigate(Constants.SCENES.COMMON.UPDATE_PROFILE)
        }}
        style={styles.marginLeft}
      />
      <View style={styles.userName}>
        <H2 numberOfLines={2}>{me.name}</H2>
        <H3 color="gray3" numberOfLines={1} bold={false}>
          {me.email}
        </H3>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  settingWrapper: {
    paddingHorizontal: 30,
    marginTop: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginLeft: -30,
    marginRight: -30,
    marginBottom: 30,
    paddingBottom: 25,
    paddingHorizontal: 16,
  },
  userName: {
    paddingLeft: 15,
    flex: 1,
  },
  marginLeft: { marginLeft: 15 },
  info: {
    marginTop: 50,
    marginBottom: 20,
    opacity: 0.5,
    fontSize: 10,
    textAlign: 'right',
  },
})

export default AccountSettingScreen
