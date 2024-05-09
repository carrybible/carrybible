import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { ImageBackground, Platform, Share, StyleSheet, TextInput, View } from 'react-native'

import Button from '@components/Button'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import { getConfig } from '@shared/Utils'
import { Config, Constants, Firestore, StreamIO } from '@shared/index'
import { useSelector } from 'react-redux'

const GroupInviteLink: React.FC = () => {
  const { color, typography } = useTheme()
  const Analytics = useAnalytic()
  const lottie = color.id === 'light' ? require('@assets/animations/pop_light.json') : require('@assets/animations/pop_dark.json')

  const { isLoading, inviteLink, inviteCode } = useInviteLink()

  const handleSharePress = async () => {
    Analytics.event(Constants.EVENTS.GROUP.INVITED)
    const linkConfig = await getConfig('invitation_link')
    await Share.share(
      {
        title: I18n.t('text.Invite friends to Carry'),
        message: linkConfig.sharing_text.replace('{{url}}', inviteLink ?? '').replace('{{code}}', inviteCode ?? ''),
      },
      { tintColor: color.accent },
    )
  }

  const body = useMemo(() => {
    return (
      <>
        <LottieView source={lottie} style={Fireworks[0]} ref={r => delayLottie(r, 0)} />
        <LottieView source={lottie} style={Fireworks[1]} ref={r => delayLottie(r, 300)} />
        <LottieView source={lottie} style={Fireworks[2]} ref={r => delayLottie(r, 500)} />
        <TextInput
          underlineColorAndroid="transparent"
          editable={false}
          numberOfLines={1}
          placeholder={isLoading ? I18n.t('text.generate-invite-code') : inviteCode}
          placeholderTextColor={color.accent2}
          style={[s.textInput, { fontSize: typography.body }]}
        />
        <Button.Full
          disabled={isLoading}
          text={I18n.t('text.Share code')}
          iconColor={color.white}
          iconSize={20}
          style={[s.bottomBtn, { backgroundColor: color.primary }]}
          textStyle={[s.bottomBtnText, { fontSize: typography.body, color: color.white }]}
          onPress={handleSharePress}
        />
      </>
    )
  }, [color, handleSharePress, inviteCode, isLoading, lottie, typography])

  return (
    <View style={s.dl__container}>
      {Config.VARIANT === 'carry' ? (
        // @ts-ignore
        <ImageBackground source={require('@assets/images/img-gradient-border.png')} style={{ ...s.dl__box }} resizeMode="contain">
          {body}
        </ImageBackground>
      ) : (
        <View style={[{ ...s.dl__box }, { borderColor: color.accent }]}>{body}</View>
      )}
    </View>
  )
}

const useInviteLink = (): { isLoading: boolean; inviteLink?: string; inviteCode?: string } => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState<string | undefined>()
  const [code, setCode] = useState<string | undefined>()

  useEffect(() => {
    const handleGetDL = async () => {
      StreamIO.client
        .channel('messaging', group.id)
        .query({})
        .then(async (c: any) => {
          const [dl] = await Firestore.Group.generateDynamicLink(c.channel)
          if (dl) {
            setLink(dl)
          } else {
            setLoading(false)
          }
        })
    }
    const handleGetInviteCode = async () => {
      const data = await Firestore.Group.generateInviteCode(group.id)
      if (data?.success) {
        let t = data.data.code
        let text = t
        if (t.length === 3) {
          text = t += '-'
        }
        if (t.length > 3 && t[3] !== '-') {
          text = t.slice(0, 3) + '-' + t.slice(3)
        }
        setCode(text)
      }
    }

    const getData = async () => {
      await Promise.all([handleGetDL(), handleGetInviteCode()])
      setLoading(false)
    }
    getData()
  }, [group.id])

  return {
    isLoading: loading,
    inviteLink: link,
    inviteCode: code,
  }
}

export function delayLottie(r, time) {
  if (r) {
    setTimeout(() => {
      r.play()
    }, time)
  }
}

const s = StyleSheet.create({
  dl__container: {
    flexGrow: 2,
    width: '100%',
  },
  dl__box: {
    height: 150,
    borderWidth: 3,
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  textInput: {
    height: Platform.OS === 'ios' ? 50 : 40,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '800',
    ...(Platform.OS === 'android' ? { paddingVertical: 0, lineHeight: 14 } : {}),
  },
  bottomBtn: {
    borderRadius: 7,
    height: 50,
  },
  bottomBtnText: {
    fontWeight: '700',
  },
  firework1: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 20,
    height: 20,
  },
  firework2: {
    position: 'absolute',
    bottom: -15,
    left: 55,
    width: 25,
    height: 25,
  },
  firework3: {
    position: 'absolute',
    top: 10,
    right: 5,
    width: 16,
    height: 16,
  },
})

const Fireworks = [s.firework1, s.firework2, s.firework3]

export default GroupInviteLink
