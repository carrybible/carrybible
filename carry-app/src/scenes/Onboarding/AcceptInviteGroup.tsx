import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import Loading from '@components/Loading'
import MemberInGroupAvatar from '@components/MemberInGroupAvatar'
import Toast from '@components/Toast'
import { Text, Title } from '@components/Typography'
import { RootState } from '@dts/state'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import IconButton from '@scenes/Launch/components/IconButton'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import { delay } from '@shared/Utils'
import I18n from 'i18n-js'
import * as React from 'react'
import { useMemo, useCallback } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

type ParamProps = {
  inviteCode?: string
  groupId?: string
  organisationId?: string
  personalInfo?: { name?: string; phone?: string }
}
type Props = StackScreenProps<{ AcceptInviteGroup: ParamProps }, 'AcceptInviteGroup'>

const AcceptInviteGroup: React.FC<Props> = props => {
  const { color: theme } = useTheme()

  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)

  const { inviteCode, groupId, organisationId, personalInfo } = props.route.params
  const Analytics = useAnalytic()

  const [groupName, setGroupName] = React.useState('')
  const [groupAvatar, setGroupAvatar] = React.useState('')
  const [members, setGroupMembers] = React.useState<string[]>([])
  const [hasOrganisation, setHasOrganisation] = React.useState(false)

  const [isJoining, setIsJoining] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { landscape } = useScreenMode()

  const [fadeInOpacityAvatar, translateYAvatar, runShowAvatar] = useFadeInUp(600, undefined, undefined, false)
  const [fadeInOpacityButton, translateYButton, runShowButton] = useFadeInUp(600, undefined, undefined, false)
  // eslint-disable-next-line no-unused-vars
  const [fadeInOpacityContent, transY, runShowContent] = useFadeInUp(600, undefined, undefined, false)

  const isGroupMember = useMemo(() => {
    return members?.includes(me.uid)
  }, [me.uid, members])

  React.useEffect(() => {
    getGroupInfo()
  }, [])

  const handlePop = useCallback(() => {
    const routes = props.navigation.getState().routes
    if (routes?.length === 1 || (routes?.length > 1 && routes[0].name === Constants.SCENES.LAUNCH.SPLASH)) {
      NavigationRoot.login()
      return
    }
    NavigationRoot.pop()
  }, [props.navigation])

  const getGroupInfo = async () => {
    setLoading(true)
    try {
      if (groupId) {
        const groupInfo = (await Firestore.Group.ref(groupId).get()).data()
        if (!groupInfo) {
          NavigationRoot.pop()
          toast.error(I18n.t('text.Group not found'))
          return
        }
        const { image, name, members: groupMembers } = groupInfo
        setGroupAvatar(image)
        setGroupName(name)
        setGroupMembers(groupMembers)
      }
      if (organisationId) {
        const organisationInfo = (await Firestore.Organisations.ref(organisationId).get()).data()
        if (!organisationInfo) {
          toast.error(I18n.t('text.Organisation not found'))
          return
        }
        setGroupAvatar(organisationInfo.image)
        setGroupName(organisationInfo.name)
        if (me.uid && me.organisation?.id) {
          setHasOrganisation(true)
        }
      }
      setLoading(false)
      runShowAvatar()
      setTimeout(() => {
        runShowButton()
        runShowContent()
      }, 1700)
    } finally {
      setLoading(false)
    }
  }

  const GroupAvatar = useMemo(
    () => (
      <Animated.View style={{ opacity: fadeInOpacityAvatar, transform: [{ translateY: translateYAvatar }] }}>
        <Avatar url={groupAvatar} size={120} name={groupName} loading={false} borderWidth={3} borderColor={theme.gray7} />
      </Animated.View>
    ),
    [fadeInOpacityAvatar, groupAvatar, groupName, theme.gray7, translateYAvatar],
  )

  const Info = useMemo(() => {
    return (
      <Animated.View style={[{ opacity: fadeInOpacityContent }, s.center]}>
        {!hasOrganisation ? (
          <Text color="accent" bold style={s.invitedToText}>
            {isGroupMember
              ? I18n.t('text.You are already a part of')
              : organisationId
              ? I18n.t('text.Youve been invited to create a')
              : personalInfo?.name
              ? I18n.t('text.Name, You have been invited to', { nameValue: personalInfo?.name })
              : I18n.t('text.You have been invited to')}
          </Text>
        ) : (
          <Text bold style={s.hasOrgText}>
            {me?.organisation?.id === organisationId
              ? I18n.t('text.You are already a part of')
              : I18n.t('text.You are already part of another organisation and cannot accept this invite')}
          </Text>
        )}
        <Title style={landscape ? s.groupNameTextLand : s.groupNameText}>{groupName}</Title>
        {!hasOrganisation ? <MemberInGroupAvatar members={members} style={s.memberAvatars} /> : null}
      </Animated.View>
    )
  }, [
    fadeInOpacityContent,
    groupName,
    hasOrganisation,
    isGroupMember,
    landscape,
    me?.organisation?.id,
    members,
    organisationId,
    personalInfo?.name,
  ])

  const Buttons = useMemo(() => {
    const onPressAccept = async () => {
      setIsJoining(true)
      // Case user not login
      if (!me.uid) {
        if (groupId) {
          dispatch({ type: TYPES.ONBOARDING.SET_GROUP_ID, groupId })
        }
        if (organisationId) {
          dispatch({ type: TYPES.ONBOARDING.SET_ORG_ID, organisationId })
        }
        dispatch({ type: TYPES.ONBOARDING.SET_INVITE_ID, invitationId: inviteCode })
        setIsJoining(false)
        if (organisationId) {
          NavigationRoot.navigate(Constants.SCENES.ONBOARDING.VIDEO)
        } else {
          NavigationRoot.navigate(Constants.SCENES.ONBOARDING.LOGIN, {
            isCreateGroup: false,
            groupInfo: {
              id: groupId,
              name: groupName,
              avatar: groupAvatar,
              members,
            },
          })
        }
        return
      }

      // Case user already logged in
      // -- If this is organisation invite link
      if (organisationId) {
        if (hasOrganisation) {
          Toast.error(I18n.t('text.You are in another organization'))
          NavigationRoot.pop()
          return
        }
        await Firestore.Auth.updateUser({
          organisation: {
            id: onboarding.organisationId || organisationId,
            role: 'leader',
          },
        })
        await delay(1500)
        setIsJoining(false)
        NavigationRoot.navigate(Constants.SCENES.ONBOARDING.VIDEO)
        return
      }

      // -- If this is normal group invite link
      if (inviteCode && groupId && !isGroupMember) {
        const acceptResult = await Firestore.Group.acceptInvitation(inviteCode)
        if (!acceptResult.success) {
          devLog('acceptResult', acceptResult)
          setIsJoining(false)
          toast.error(acceptResult?.response?.message)
          return
        }
        Analytics.event('Accepted Invitation')
        await delay(1500)
        setIsJoining(false)
        dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
        NavigationRoot.home()
        return
      }
      NavigationRoot.home()
    }

    return (
      <Animated.View style={[s.bottomBtn, { opacity: fadeInOpacityButton, transform: [{ translateY: translateYButton }] }]}>
        <BottomButton
          rounded
          style={s.joinGroupBtnContainer}
          title={!hasOrganisation && !isGroupMember ? I18n.t('Accept Invite') : I18n.t('text.Done')}
          onPress={onPressAccept}
          loading={isJoining}
        />
        <TouchableOpacity style={s.cancelBtn} onPress={handlePop}>
          <Text color="gray2">{I18n.t('text.Cancel')}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [
    fadeInOpacityButton,
    hasOrganisation,
    isGroupMember,
    isJoining,
    translateYButton,
    Analytics,
    dispatch,
    groupAvatar,
    groupId,
    groupName,
    inviteCode,
    me?.uid,
    members,
    onboarding.organisationId,
    organisationId,
    handlePop,
  ])

  if (!!groupId !== !!inviteCode) {
    return null
  }

  if (!groupId && !organisationId) {
    return null
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Container safe>
      <View style={s.header}>
        <IconButton iconStyle={s.backIcon} onPress={handlePop} icon={'chevron-thin-left'} font={'entypo'} size={22} />
      </View>
      {landscape ? (
        <ScreenView>
          <View style={s.container}>{GroupAvatar}</View>
          <View style={s.centerJustify}>
            {Info}
            {Buttons}
          </View>
        </ScreenView>
      ) : (
        <>
          <View style={s.container}>
            {GroupAvatar}
            {Info}
          </View>
          {Buttons}
        </>
      )}
    </Container>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerJustify: { flex: 1, justifyContent: 'center' },
  center: {
    alignItems: 'center',
  },
  backIcon: {
    marginBottom: 0,
    opacity: 0.5,
  },
  joinGroupBtnContainer: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  memberAvatars: {
    marginTop: 34,
  },
  invitedToText: {
    marginTop: 25,
  },
  groupNameText: {
    marginTop: 10,
    textAlign: 'center',
    marginHorizontal: '10%',
  },
  groupNameTextLand: {
    marginTop: 10,
    textAlign: 'center',
    marginHorizontal: '10%',
    marginBottom: -30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  hasOrgText: {
    marginTop: 20,
    marginHorizontal: 32,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  bottomBtn: {
    marginBottom: 30,
  },
})

export default AcceptInviteGroup
