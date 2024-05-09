/**
 * AcceptInvitation
 *
 * @format
 *
 */

import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import CloseButton from '@components/CloseButton'
import Container from '@components/Container'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import { Footnote, H2, Subheading } from '@components/Typography'
import useFirestoreFunc from '@hooks/useFirestoreFunc'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, LocalStorage } from '@shared/index'
import I18n from 'i18n-js'
import React, { useRef, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'

interface Props {
  route: any
}

const AcceptInvitation: React.FC<Props> = props => {
  const acceptedGroupId = useRef('')
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const Analytics = useAnalytic()
  const { color } = useTheme()

  const dispatch = useDispatch()
  const [accepting, setAccepting] = useState(false)
  const { data, loading, success } = useFirestoreFunc<App.FuncInviteGetResponse>('func_invite_get', props.route.params.invitation.id)
  if (loading) return <Loading />
  function openGroup(groupId) {
    dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
    navigation.popToTop()
    navigation.navigate(Constants.SCENES.GROUP_HOME)
  }

  function handleDone() {
    LocalStorage.clearStateOnboarding()
    global.HANDLED_DL = props.route.params.invitation
    if (props.route?.params?.fromOnboarding) {
      openGroup(data?.group?.id)
    } else {
      navigation.goBack()
    }
  }

  function handleAcceptInvitation() {
    setAccepting(true)
    Firestore.Group.acceptInvitation(props.route.params.invitation.id)
      .then(r => {
        // if (r.success) {
        acceptedGroupId.current = r?.response?.invite?.groupId
        Analytics.event('Accepted Invitation')
        LocalStorage.clearStateOnboarding()

        global.HANDLED_DL = props.route.params.invitation

        openGroup(r?.response?.invite?.groupId)
        // } else {
        //   setAccepting(false)
        // }
      })
      .catch(e => {
        setAccepting(false)
      })
  }

  return (
    <Container safe>
      <CloseButton
        onPress={() => {
          global.HANDLED_DL = props.route.params.invitation
          navigation.goBack()
        }}
      />
      <View style={s.container}>
        <View style={s.background__container}>
          <Image
            source={require('@assets/images/img-invite-bg.png')}
            style={[s.background, { tintColor: color.id === 'light' ? '#E7EDFF' : '#4F4F4F' }]}
          />
        </View>
        <View style={s.info__container}>
          {success ? (
            <>
              <Avatar url={data?.inviter.image} size={70} style={[s.info__avatar, { borderColor: color.background }]} />
              <Footnote style={{ opacity: 0.5, marginBottom: 5 }}>
                {data?.isGroupMember ? I18n.t('text.You are already a part of') : I18n.t('params.invited', { name: data?.inviter.name })}
              </Footnote>
              <H2>{data?.group.name}</H2>
              <View style={[s.info__members, { backgroundColor: `${color.background}70` }]}>
                <Footnote>{I18n.t('params.member', { count: data?.group.memberCount })}</Footnote>
              </View>
            </>
          ) : (
            <>
              <Icon
                source="meh"
                size={64}
                color={color.text}
                style={[s.info__avatar, { borderColor: color.background, backgroundColor: color.background }]}
              />
              <H2>{I18n.t('text.Invalid link')}</H2>
              <Subheading style={{ marginTop: 10 }}>{I18n.t('text.This invite may have expired')}</Subheading>
            </>
          )}
        </View>
      </View>
      {!success || data?.isGroupMember ? (
        <BottomButton title={I18n.t('text.Done')} loading={accepting} rounded onPress={handleDone} />
      ) : (
        <BottomButton title={I18n.t('text.Accept invitation')} loading={accepting} rounded onPress={handleAcceptInvitation} />
      )}
    </Container>
  )
}

AcceptInvitation.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background__container: {
    width: '92%',
    aspectRatio: 1,
    maxWidth: 400,
    justifyContent: 'center',
  },
  background: {
    aspectRatio: 1,
    flex: 1,
  },
  info__container: {
    alignContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  info__avatar: {
    borderWidth: 3,
    borderRadius: 35,
    marginTop: -65,
    marginBottom: 25,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  info__members: {
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
})

export default AcceptInvitation
