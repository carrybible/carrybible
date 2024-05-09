import Avatar from '@components/Avatar'
import Button from '@components/Button'
import GroupInviteLink from '@components/GroupInviteLink'
import { RootState } from '@dts/state'
import useCheckNavigation from '@hooks/useCheckNavigation'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import BottomButton from '../../components/BottomButton'
import Container from '../../components/Container'
import { H1, Subheading } from '../../components/Typography'
import { Metrics } from '../../shared'

interface Props {
  navigation: any
  route: any
}

const ShareGroupScreen: React.FC<Props> = props => {
  const { navigateToGroupHome } = useCheckNavigation()
  const { color } = useTheme()
  const { landscape } = useScreenMode()
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const handleFinishPress = () => {
    if (props.route.params.navigateHome) {
      navigateToGroupHome()
    } else {
      NavigationRoot.pop()
    }
  }

  return (
    <Container safe backgroundColor={color.background}>
      <Button.Icon style={s.closeBtn} icon="x" size={35} color={color.text} onPress={handleFinishPress} />

      <View style={[s.content__container, landscape ? s.reduceTopSpace : {}]}>
        <ScreenView>
          <View style={s.intro__container}>
            <H1 bold>{I18n.t('text.Invite your friends')}</H1>
            <View style={s.inviteWrapper}>
              <Avatar size={120} url={group.image} loading={false} borderWidth={3} borderColor={color.gray7} pressable={false} />
              <Subheading style={[{ ...s.intro__subtitle, color: color.gray }, s.desc]}>
                {I18n.t('text.Share the code below to invite others to join your study')}
              </Subheading>
            </View>
          </View>
          <GroupInviteLink />
          <BottomButton
            backgroundColor={'middle'}
            style={s.btn}
            textColor={'gray2'}
            titleStyle={s.btnTitle}
            title={I18n.t('text.Maybe later')}
            onPress={handleFinishPress}
            rounded
          />
        </ScreenView>
      </View>
    </Container>
  )
}

const s = StyleSheet.create({
  content__container: {
    paddingHorizontal: Metrics.insets.horizontal,
    flex: 1,
    paddingTop: Metrics.header.height,
    justifyContent: 'flex-start',
  },
  intro__container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  intro__subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 23,
    fontWeight: '500',
  },
  closeBtn: {
    marginRight: 16,
    alignSelf: 'flex-end',
  },
  inviteWrapper: {
    paddingTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desc: {
    paddingTop: 10,
    maxWidth: '80%',
  },
  btn: {
    marginBottom: 20,
  },
  btnTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  reduceTopSpace: {
    marginTop: -20,
  },
})

export default ShareGroupScreen
