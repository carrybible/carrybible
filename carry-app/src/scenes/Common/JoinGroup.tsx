import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import Loading from '@components/Loading'
import TextField from '@components/TextField'
import { H2, H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { OnboardingState } from '@redux/reducers/onboarding'
import IconButton from '@scenes/Launch/components/IconButton'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import { formatCodeInput } from '@shared/Utils'
import cc from 'color'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import * as React from 'react'
import { Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

const JoinGroup: React.FC<any> = props => {
  const { color: theme } = useTheme()
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const [inviteCode, setInviteCode] = React.useState('')
  const [groupName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const onboarding = useSelector<any, OnboardingState>(s => s.onboarding)
  const dispatch = useDispatch()
  const lottieStars = React.useRef(null)
  const lottieGroup = React.useRef(null)
  const insets = useSafeAreaInsets()

  React.useEffect(() => {
    dispatch({ type: TYPES.ONBOARDING.SET_GROUP_ID, groupId: '' })
    dispatch({ type: TYPES.ONBOARDING.SET_INVITE_ID, invitationId: '' })
  }, [])

  const onPressJoinGroup = async () => {
    setLoading(true)
    const invitation = await Firestore.Group.getInvitationByCode(inviteCode.replace('-', ''))

    if (invitation) {
      if (invitation.groupId) {
        const group = await Firestore.Group.getGroup({ groupId: invitation.groupId })
        const isMember = group && group.members.includes(me.uid)
        navigation.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_GROUP, {
          inviteCode,
          groupId: invitation?.groupId,
          organisationId: invitation?.organisationId,
          isMember,
        })
      }
      if (invitation.organisationId) {
        if (!invitation.sharedGroups || invitation.sharedGroups.length === 0) {
          toast.error(I18n.t('text.Invite code is not valid'))
          return
        }
        navigation.navigate(Constants.SCENES.ONBOARDING.ACCEPT_INVITE_ORGANISATION, { invitation })
      }
    } else {
      toast.error(I18n.t('Invite code is incorrect'))
    }

    setLoading(false)
  }

  const onChangeText = (_: string, t: string) => {
    setInviteCode(formatCodeInput(t))
  }

  const onPressCancel = () => {
    navigation.goBack()
  }

  if (loading) return <Loading />
  return (
    <Container safe>
      <View style={s.header}>
        <IconButton
          iconStyle={s.removeMargin}
          onPress={() => {
            NavigationRoot.pop()
          }}
          icon={'chevron-thin-left'}
          font={'entypo'}
          size={22}
        />
      </View>
      {!onboarding.inviteId ? (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={insets.bottom}>
            <ScrollView contentContainerStyle={s.scrollView}>
              <View style={s.iconContainer}>
                <Text style={s.handText}>👋</Text>
              </View>
              <H3 style={s.title}>{I18n.t('text.Join a group')}</H3>
              <Text style={s.desc}>{I18n.t('text.Enter your invite code below to join a group')}</Text>
              <TextField
                autoCapitalize="characters"
                containerStyle={s.textField}
                style={[
                  s.textFieldText,
                  !inviteCode && {
                    backgroundColor: cc(theme.background).mix(cc(theme.gray6), 0.4).hex(),
                    borderColor: cc(theme.middle).mix(cc(theme.gray4), 0.4).hex(),
                  },
                ]}
                label={I18n.t('Invite code')}
                placeholderWeight="500"
                onChangeText={onChangeText}
                value={inviteCode}
                numberOfLines={1}
                maxLength={11}
              />
              <View style={s.joinGroupBtnContainer}>
                <BottomButton style={s.joinGroupBtnContainer} title={I18n.t('Join group')} onPress={onPressJoinGroup} rounded />
                <BottomButton title={I18n.t('text.Cancel')} onPress={onPressCancel} backgroundColor="middle" textColor="gray3" />
              </View>
              <View style={s.footer} />
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      ) : (
        <View style={s.container}>
          <LottieView ref={lottieStars} source={require('@assets/animations/stars.json')} style={s.stars} loop />
          <H2 style={s.groupName}>{groupName} Group</H2>
          <LottieView ref={lottieGroup} source={require('@assets/animations/group_created.json')} style={s.lottie} />
        </View>
      )}
    </Container>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  handText: {
    fontSize: 50,
  },
  stars: { width: Metrics.screen.width, height: 160 },
  removeMargin: { marginBottom: 0 },
  iconContainer: {
    backgroundColor: '#E7EDFF',
    width: 135,
    height: 135,
    borderRadius: 67.5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  groupName: {
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 50,
  },
  title: {
    alignSelf: 'center',
    marginTop: 17,
  },
  desc: {
    marginHorizontal: 66,
    textAlign: 'center',
    marginTop: 10,
  },
  textField: {
    marginTop: 22,
    marginHorizontal: 20,
  },
  lottie: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    position: 'absolute',
  },
  joinGroupBtnContainer: {
    marginTop: 16,
    marginHorizontal: 10,
  },
  footer: {
    height: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  textFieldText: {
    borderWidth: 2,
    maxHeight: 120,
    fontWeight: '500',
  },
  scrollView: {
    marginTop: 80,
  },
})

export default JoinGroup
