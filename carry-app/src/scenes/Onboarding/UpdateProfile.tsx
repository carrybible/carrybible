import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { H1, H3, Subheading } from '@components/Typography'
import { RootState } from '@dts/state'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import BorderTextInput from '@scenes/Study/Creation/AdvancedStudy/components/BorderTextInput'
import { Constants, Firestore, Metrics } from '@shared/index'
import { UnsplashImage } from '@shared/Unsplash'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { Animated, Keyboard, ScrollView, StyleSheet, TextInputProps, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

const DEFAULT_AVATARS = [
  'https://i.imgur.com/4cmqiiF.png',
  'https://i.imgur.com/rUywFJ3.png',
  'https://i.imgur.com/GPOQ7Le.png',
  'https://i.imgur.com/1A0dIE1.png',
  'https://i.imgur.com/I9wzrtH.png',
  'https://i.imgur.com/JZV6E9r.png',
  'https://i.imgur.com/TVzZTqg.png',
]

interface Props {
  navigation?: any
  onPressContinue: () => void
  initValue?: string | undefined
}

const UpdateProfile: React.FC<Props> = props => {
  const [loading, setLoading] = useState<boolean>(false)
  const [updatingAvatar, setUpdatingAvatar] = useState(false)
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const [name, setName] = useState<string>(props.initValue ?? me.name ?? '')
  const [phone, setPhone] = useState<string>(me.phoneNumber || '')

  const keyboardPadding = useKeyboardPadding({})
  const isStandalonePage = !!props.navigation

  useEffect(() => {
    if (!me.image) {
      setUpdatingAvatar(true)
      const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
      Firestore.Auth.updateUser({ image: randomAvatar }).then(() => {
        setUpdatingAvatar(false)
      })
    }
  }, [])

  const onPressContinue = async () => {
    if (!name || name.length < 3) {
      if (!me.name) {
        toast.error(I18n.t('error.Name is not valid'))
        return
      }
    }
    Keyboard.dismiss()

    setLoading(true)
    const { success } = await Firestore.Auth.updateUser({ name: name, phoneNumber: phone })
    setLoading(false)
    if (!success) {
      toast.error(I18n.t('error.Unable to save your selection'))
    } else {
      if (isStandalonePage) {
        props.navigation.pop()
      } else {
        props?.onPressContinue()
      }
    }
  }

  function openImagePicker() {
    Keyboard.dismiss()
    NavigationRoot.push(Constants.SCENES.MODAL.PICKER_IMAGE, {
      onSelect: (i: UnsplashImage) => {
        if (i) {
          setUpdatingAvatar(true)

          if (i.source === 'gallery') {
            Firestore.Storage.upload(i.urls.regular, 'images', 'avatar')
              .then(url => {
                Firestore.Auth.updateUser({ image: url }).then(() => {
                  setUpdatingAvatar(false)
                })
              })
              .catch(e => {
                setUpdatingAvatar(false)
              })
          } else {
            Firestore.Auth.updateUser({ image: i.urls.regular }).then(() => {
              setUpdatingAvatar(false)
            })
          }
        }
      },
    })
  }

  return (
    <Container safe>
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
        ]}>
        <ScrollView contentContainerStyle={s.center} alwaysBounceVertical={false}>
          {isStandalonePage && (
            <HeaderBar
              iconLeft={'chevron-thin-left'}
              iconLeftFont={'entypo'}
              colorLeft={color.text}
              iconLeftSize={22}
              onPressLeft={() => {
                NavigationRoot.pop()
              }}
            />
          )}
          <View style={s.avaContainer}>
            <H1 style={s.title}>{isStandalonePage ? I18n.t('text.Confirm your details') : I18n.t('text.What do people call you')}</H1>
            <Avatar
              url={me.image}
              size={100}
              name={me.name}
              loading={updatingAvatar}
              style={s.ava}
              borderWidth={2}
              borderColor={color.whiteSmoke}
            />
            <TouchableOpacity style={s.textBtn} onPress={openImagePicker}>
              <Subheading bold color="accent">
                {I18n.t('text.Change avatar')}
              </Subheading>
            </TouchableOpacity>
          </View>

          <InputField
            title={I18n.t('text.Name')}
            value={name}
            onChange={t => setName(t)}
            placeholder={I18n.t('text.Please input your name')}
            maxLength={30}
          />
          <InputField
            title={I18n.t('text.Email address')}
            value={me.email ?? ''}
            placeholder={I18n.t('text.Please input your email')}
            editable={false}
          />
          <InputField
            keyboardType="phone-pad"
            title={I18n.t('text.Phone')}
            value={phone}
            onChange={t => setPhone(t)}
            placeholder={I18n.t('text.Enter your phone number')}
            onFocus={() => {
              setPhone(phone.replace(/[^0-9]/g, ''))
            }}
            onBlur={() => {
              if (phone) {
                setPhone(phone)
              }
            }}
          />
        </ScrollView>
        <BottomButton
          title={isStandalonePage ? I18n.t('text.Finish') : I18n.t('text.Continue')}
          rounded
          disabled={!name}
          onPress={onPressContinue}
          loading={loading}
          avoidKeyboard={false}
        />
      </Animated.View>
    </Container>
  )
}

UpdateProfile.defaultProps = {}

const InputField: React.FC<
  TextInputProps & {
    value: string
    title: string
    onChange?: (value: string) => void
  }
> = ({ value, onChange, title, ...rest }) => {
  return (
    <View style={s.textInput}>
      <H3 color="gray3" style={s.titleInputField}>
        {title}
      </H3>
      <BorderTextInput maxLength={150} numberOfLines={1} value={value} onChangeText={onChange} {...rest} style={s.textInputStyle} />
    </View>
  )
}

const s = StyleSheet.create({
  title: {
    marginVertical: 15,
    marginLeft: 15,
    alignSelf: 'center',
    marginTop: 30,
  },
  content: {
    flex: 1,
  },
  avaContainer: {
    alignItems: 'center',
  },
  ava: { marginBottom: 20 },
  textBtn: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: 20,
    width: Metrics.screen.width - Metrics.insets.horizontal * 2,
  },
  center: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  titleInputField: { paddingLeft: 2, fontWeight: '500' },
  textInputStyle: { marginTop: 10, maxHeight: 120, fontWeight: '500' },
})

export default UpdateProfile
