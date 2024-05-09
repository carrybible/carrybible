import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import Loading from '@components/Loading'
import TextField from '@components/TextField'
import Toast from '@components/Toast'
import { H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useTheme from '@hooks/useTheme'
import { firebase } from '@react-native-firebase/storage'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useEffect, useMemo, useState, FC } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

type Props = StackScreenProps<{ ConnectOrgScreen: { isEditProfile: boolean } }, 'ConnectOrgScreen'> & {
  onPressContinue: () => void
  org?: App.Organisation
  initPhone?: string
}

const ConnectOrgScreen: FC<Props> = props => {
  const { color: theme } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [phone, setPhoneNumber] = useState(me.phoneNumber || props.initPhone || '')
  const [org, setOrg] = useState<App.Organisation>()

  const [loading, setLoading] = useState(false)
  const keyboardPadding = useKeyboardPadding({})

  useEffect(() => {
    setOrg(props?.org || group.org)
  }, [props.org, group.org])

  const onPressContinue = async () => {
    if (phone.length < 5) {
      Toast.error(I18n.t('error.Phone number is not valid'))
      return
    }
    setLoading(true)
    const { success } = await Firestore.Auth.updateUser({ phoneNumber: phone })
    setLoading(false)
    if (!success) {
      Toast.error(I18n.t('error.Unable to save your phone number'))
    } else {
      if (props.onPressContinue) {
        return props.onPressContinue()
      }
      NavigationRoot.replace(Constants.SCENES.COMMON.UPDATE_PROFILE)
    }
  }

  const onPressLater = () => {
    const onSkip = async () => {
      if (props?.route?.params?.isEditProfile) {
        return NavigationRoot.replace(Constants.SCENES.COMMON.UPDATE_PROFILE)
      }
      setLoading(true)
      await Firestore.Auth.updateUser({
        disabledRequirePhone: firebase.firestore.FieldValue.arrayUnion(org?.id || ''),
      })
      setLoading(false)
      if (props?.onPressContinue) {
        return props.onPressContinue()
      }
      return NavigationRoot.pop()
    }
    if (!me.phoneNumber) {
      NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
        titleIcon: <Text style={s.titleIcon}>{'👋'}</Text>,
        title: I18n.t('text.Are you sure'),
        description: I18n.t('text.NewLife church connects personally with members through text for important info', {
          orgName: org?.name,
        }),
        confirmTitle: I18n.t('text.Continue'),
        cancelTitle: I18n.t('text.No thanks'),
        onConfirm: () => undefined,
        onCancel: onSkip,
      })
    } else {
      onSkip()
    }
  }

  const AvatarView = useMemo(() => {
    if (org?.image) {
      return <Avatar url={org?.image} size={120} name={org?.name} loading={false} borderWidth={3} borderColor={theme.gray7} />
    }
    return (
      <View style={[s.defaultIcon, { backgroundColor: theme.blue0 }]}>
        <Text style={s.iconSize}>{'📱'}</Text>
      </View>
    )
  }, [org?.image, org?.name])

  function formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    }
    return null
  }

  return (
    <Container safe>
      {org ? (
        <>
          <Animated.View
            style={[
              s.content,
              {
                transform: [
                  {
                    translateY: keyboardPadding,
                  },
                ],
              },
            ]}
          >
            <ScrollView style={s.scroll}>
              <H1 style={s.title}>
                {I18n.t('text.Connect with Org', {
                  orgName: org?.name,
                })}
              </H1>
              <View style={s.container}>
                {AvatarView}
                <View style={s.center}>
                  <Text color="gray" style={s.hasOrgText}>
                    {I18n.t('text.Share your phone number to stay in the loop with church', {
                      orgName: org?.name,
                    })}
                  </Text>
                </View>
                <View style={s.textInput}>
                  <TextField
                    id="name"
                    label={I18n.t('text.Phone number')}
                    numberOfLines={1}
                    maxLength={40}
                    value={phone}
                    onChangeText={(id, value) => {
                      setPhoneNumber(value)
                    }}
                    style={s.textField}
                    returnKeyType="go"
                    keyboardType="number-pad"
                    // @ts-ignore
                    onFocus={() => {
                      setPhoneNumber(phone.replace(/[^0-9]/g, ''))
                    }}
                    onBlur={() => {
                      if (phone) {
                        const formatNumber = formatPhoneNumber(phone.replace(/[^0-9]/g, ''))
                        setPhoneNumber(formatNumber || phone)
                      }
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            <BottomButton
              rounded
              style={s.joinGroupBtnContainer}
              title={I18n.t('text.Continue')}
              onPress={onPressContinue}
              disabled={!phone}
              loading={loading}
              avoidKeyboard={false}
            />
            <TouchableOpacity style={s.cancelBtn} onPress={onPressLater} disabled={loading}>
              <Text color="gray2">{I18n.t('text.Maybe later')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        <Loading />
      )}
    </Container>
  )
}

const s = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: {
    marginVertical: 15,
    alignSelf: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
  },
  center: {
    alignItems: 'center',
  },
  joinGroupBtnContainer: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  hasOrgText: {
    marginTop: 20,
    marginHorizontal: 32,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  textInput: {
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: 37,
    width: Metrics.screen.width - Metrics.insets.horizontal * 2,
  },
  textField: {
    maxHeight: 120,
    fontWeight: '500',
  },
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
  defaultIcon: {
    height: 120,
    width: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSize: { fontSize: 50 },
  scroll: { flex: 1, minHeight: '70%' },
})

export default ConnectOrgScreen
