import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import MemberInGroupAvatar from '@components/MemberInGroupAvatar'
import { H1, H3, Text } from '@components/Typography'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import BottomLogin from '@scenes/Launch/components/BottomLogin'
import { NavigationRoot } from '@scenes/root'
import Config from '@shared/Config'
import I18n from 'i18n-js'
import React, { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

type ParamProps = {
  isCreateGroup: boolean
  groupInfo: {
    id: string
    name: string
    avatar: string
    members: string[]
  }
}

type Props = StackScreenProps<{ OnboardingLoginScreen: ParamProps }, 'OnboardingLoginScreen'>

const OnboardingLoginScreen: React.FC<Props> = props => {
  const { color } = useTheme()

  const bottomModal = useRef<any>()
  const { isCreateGroup, groupInfo } = props.route.params
  const { landscape } = useScreenMode()

  const onPressLogin = () => {
    bottomModal.current?.open()
  }

  const Header = useMemo(
    () => (
      <>
        {isCreateGroup ? (
          <Text color="accent" bold style={styles.invitedToText}>
            {I18n.t(`text.You have created`)}
          </Text>
        ) : null}
        {isCreateGroup ? (
          <H1 align="center" style={styles.titleGroupCreate}>
            {groupInfo.name}
          </H1>
        ) : null}
        <Avatar url={groupInfo.avatar} size={145} loading={false} borderWidth={3} borderColor={color.gray7} touchable={false} />
        {groupInfo.members?.length > 0 ? <MemberInGroupAvatar members={groupInfo.members} style={styles.memberAvatars} /> : null}
        {!isCreateGroup ? (
          <H1 align="center" style={styles.titleGroupJoin}>
            {I18n.t(`text.Let s get you into your group`)}
          </H1>
        ) : null}
      </>
    ),
    [color.gray7, groupInfo.avatar, groupInfo.members, groupInfo.name, isCreateGroup],
  )

  const SetupText = useMemo(
    () => (
      <H3 align="center" color={'gray'} style={styles.description}>
        {!isCreateGroup
          ? I18n.t(`text.Set up an account to start connecting with your community`)
          : I18n.t(`text.Set up an account to save your group and plan you created`)}
      </H3>
    ),
    [isCreateGroup],
  )

  const Buttons = useMemo(
    () => (
      <>
        <BottomButton rounded title={I18n.t('text.Create an account')} onPress={onPressLogin} />
        <BottomButton
          rounded
          secondary
          style={[
            { backgroundColor: color.background, borderColor: Config.VARIANT === 'carry' ? color.blue1 : color.lightAccent },
            styles.bottom,
          ]}
          title={I18n.t('text.I already have an account')}
          onPress={onPressLogin}
        />
      </>
    ),
    [color.background, color.blue1],
  )

  return (
    <Container safe={true} style={styles.container}>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.gray2}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      {landscape ? (
        <ScreenView rightProps={{ style: styles.center }}>
          <View style={styles.wrapper}>{Header}</View>
          {SetupText}
          <View style={styles.landscapeButtonWrapper}>{Buttons}</View>
        </ScreenView>
      ) : (
        <>
          <View style={styles.wrapper}>
            {Header}
            {SetupText}
          </View>
          {Buttons}
        </>
      )}

      <BottomLogin ref={bottomModal} />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  wrapper: {
    flex: 1,
    paddingTop: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatars: {
    marginTop: 10,
  },
  invitedToText: {
    marginBottom: 10,
  },
  titleGroupJoin: {
    width: '60%',
    marginTop: 25,
  },
  titleGroupCreate: {
    width: '60%',
    marginBottom: 25,
  },
  description: {
    width: '80%',
    marginTop: 15,
    opacity: 0.8,
  },
  bottom: {
    marginBottom: 20,
  },
  center: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeButtonWrapper: { width: '100%', marginTop: 30 },
})

export default OnboardingLoginScreen
