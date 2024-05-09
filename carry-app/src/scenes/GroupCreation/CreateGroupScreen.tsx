import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import TextField from '@components/TextField'
import { H2, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useOrg from '@hooks/useOrg'
import { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { OnboardingState } from '@redux/reducers/onboarding'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import { RolesCanCreateGroup } from '@shared/Constants'
import { Constants, Firestore, LocalStorage, Metrics, Unsplash } from '@shared/index'
import { UnsplashImage } from '@shared/Unsplash'
import cc from 'color'
import I18n from 'i18n-js'
import React, { useCallback, useMemo, useState } from 'react'
import { Animated, Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

const DEFAULT_PIC =
  'https://images.unsplash.com/photo-1485201543483-f06c8d2a8fb4?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1275&q=80'

interface Props {
  navigation: any
  route: any
}

const CreateGroup: React.FC<Props> = props => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const Analytics = useAnalytic()
  const privacy = 'private'
  const isOnboarding = props.route?.params?.isOnboarding
  const hideClose = props.route?.params?.hideClose
  const initialCampusId = props.route?.params?.campus as string | undefined
  const { color: theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [changeState, setChangeState] = useState<any>({ name: '', fulfilled: false })
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const campuses = useSelector<RootState, RootState['campuses']>(state => state.campuses)
  const onboarding = useSelector<any, OnboardingState>(s => s.onboarding)
  const { org } = useOrg()

  const selectedCampus = useMemo(() => {
    if (campuses.length === 1) {
      return campuses[0]
    }

    if (initialCampusId) {
      return campuses.find(campus => campus.id === initialCampusId)
    }
  }, [campuses, initialCampusId])

  function handleTextChanged(id, text) {
    setChangeState(c => ({
      ...c,
      [id]: text,
      fulfilled: text.length > 4 && privacy,
    }))
  }

  React.useEffect(() => {
    if (isOnboarding) {
      LocalStorage.saveOnboardingStateScreen(Constants.SCENES.ONBOARDING.QUESTIONS, { index: 4, isCreateScreen: true })
    }
    getAvatar()
  }, [])

  React.useEffect(() => {
    setChangeState(c => ({
      ...c,
      fulfilled: c.name.length > 4 && privacy,
    }))
  }, [privacy])

  const handleCreateGroupUnAuthen = () => {
    dispatch({ type: TYPES.ONBOARDING.SET_NAME, name: changeState.name })
    toast.success(I18n.t('text.Group is created'))
    navigation.navigate(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
      groupId: null,
      skippable: true,
      isNormalGroup: true,
      fromCreateGroup: true,
    })
  }

  const getAvatar = async () => {
    let imageUrl = selectedCampus?.image
    if (!imageUrl) {
      imageUrl = (await Unsplash.getRandomImage('nature'))?.urls?.regular
    }
    dispatch({
      type: TYPES.ONBOARDING.SET_AVATAR,
      avatar: { url: imageUrl, type: 'splash' },
    })
  }

  const handleChangeAvatar = () => {
    navigation.push(Constants.SCENES.MODAL.PICKER_IMAGE, {
      onSelect: (i: UnsplashImage) => {
        if (i) {
          dispatch({
            type: TYPES.ONBOARDING.SET_AVATAR,
            avatar: { url: i.urls.regular, type: i.source === 'gallery' ? 'local' : 'splash' },
          })
        }
      },
    })
  }

  async function handleCreateSpace() {
    // Set a flag here to show invitation modal in HomeScreen after create a new group
    global.SHOW_INVITE_MODAL_CREATE_GROUP = true
    if (!me.uid && !me.streamToken) {
      devLog('Handle unauthen group')
      handleCreateGroupUnAuthen()
      return
    }

    Keyboard.dismiss()
    setLoading(true)

    try {
      const avatar = onboarding.groupAvatar
      let image = DEFAULT_PIC
      if (avatar && avatar.type === 'local' && avatar.url) {
        await Firestore.Storage.upload(avatar.url, 'images', `group_avatar_${changeState.name}_${new Date().getTime()}`).then(async url => {
          image = url
        })
      }

      if (changeState.name.length > 4 && privacy) {
        const groupData: any = {
          image,
          name: changeState.name,
          visibility: privacy.toLowerCase(),
          organisation: {
            id: me.organisation?.id,
          },
        }

        if (!me?.organisation?.id || !RolesCanCreateGroup.includes(me?.organisation?.role || '')) {
          if (me.organisation && me.organisation.role === 'member' && org?.newGroupPermission === 'member') {
            // if newGroupPermission === 'member', So member can also create group belong to ORG
          } else {
            toast.error(I18n.t('error.Unable to create group'))
            return
          }
        }

        if (selectedCampus) {
          // if user role is 'member' or 'leader', they should belong to only 1 Campus
          groupData.organisation = {
            id: me.organisation.id,
            campusId: selectedCampus.id,
          }
        }

        devLog('[Create New Group]', groupData)
        const response = await Firestore.Group.create(groupData)
        if (response.success) {
          // in case user enter create group from onboarding flow, need to clear save state of onboarding
          await LocalStorage.storeData(LocalStorage.keys.ONBOARDING_STATE, {})
          toast.success(I18n.t('text.Group is created'))
          // await LocalStorage.saveOnboardingStateScreen(Constants.SCENES.LAUNCH.BIBLE_GROUPS)
          LocalStorage.clearStateOnboarding()
          dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: response.data?.id })
          navigation.replace(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
            groupId: response.data?.id || '',
            fromCreateGroup: true,
          })
        } else {
          toast.error(response?.message || '')
        }
      }
    } catch (error: any) {
      devWarn('Create', error)
      toast.error(error?.message)
      toast.error(I18n.t('error.Unable to create group'))
    }
    setLoading(false)
  }

  const keyboardPadding = useKeyboardPadding({ androidEnable: false, extraPadding: -220 })

  return (
    <Container safe>
      {hideClose ? null : (
        <HeaderBar
          iconRight={'x'}
          colorRight={theme.text}
          iconRightSize={22}
          onPressRight={() => {
            NavigationRoot.pop()
            Analytics.event(Constants.EVENTS.GROUP.CREATE_CANCELLED)
          }}
        />
      )}
      <ScrollView>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <Animated.View style={[s.content__container, { transform: [{ translateY: keyboardPadding }] }]}>
            <ScreenView>
              <View style={{}}>
                <View style={s.intro__container}>
                  <H2 bold style={s.titleText}>
                    👋 {I18n.t('text.what should we call your group')}
                  </H2>
                </View>
                <View style={s.avatarContainer}>
                  <Avatar
                    url={onboarding.groupAvatar?.url}
                    size={120}
                    name={me.name}
                    loading={false}
                    onPress={handleChangeAvatar}
                    borderWidth={3}
                    borderColor={theme.gray7}
                  />
                  <Text color="accent" bold style={s.changeAvatarText} onPress={handleChangeAvatar}>
                    {I18n.t('text.change group avatar')}
                  </Text>
                </View>
              </View>
              <View style={s.content}>
                <View style={s.actions__container}>
                  <TextField
                    id="name"
                    label={I18n.t('text.group name')}
                    numberOfLines={1}
                    placeholderTextColor={theme.gray3}
                    maxLength={80}
                    onChangeText={handleTextChanged}
                    containerStyle={[s.textField__container]}
                    style={[
                      s.textField,
                      !changeState.name && {
                        backgroundColor: cc(theme.background).mix(cc(theme.gray6), 0.4).hex(),
                        borderColor: cc(theme.middle).mix(cc(theme.gray4), 0.4).hex(),
                      },
                    ]}
                    returnKeyType="next"
                  />
                </View>
              </View>
              <BottomButton
                style={s.createGroupBtn}
                title={I18n.t('text.Create group')}
                rounded
                disabled={!changeState.fulfilled || !privacy}
                onPress={handleCreateSpace}
                loading={loading}
                avoidKeyboard={false}
                keyboardVerticalOffset={50}
              />
            </ScreenView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </Container>
  )
}

const s = StyleSheet.create({
  content__container: {
    flex: 1,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingTop: 10,
  },
  titleText: {
    alignSelf: 'flex-start',
  },
  intro__container: {
    flexDirection: 'column',
    alignItems: 'center',
  },

  actions__container: {
    flexGrow: 0.5,
  },
  textField__container: {
    marginBottom: 15,
    borderRadius: 7,
    marginTop: 45,
  },
  textField: {
    maxHeight: 120,
    fontWeight: '500',
    borderWidth: 2,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupBtn: {
    marginBottom: 20,
    marginHorizontal: 0,
  },
  changeAvatarText: {
    marginTop: 20,
  },
  content: { flex: 1, justifyContent: 'center' },
})

export const useNavigateToCreateGroupScreen = ({
  isOnboarding = false,
  hideClose = false,
}: {
  isOnboarding?: boolean
  hideClose?: boolean
} = {}) => {
  const campuses = useSelector<RootState, RootState['campuses']>(state => state.campuses)

  return useCallback(() => {
    if (campuses.length > 1) {
      return NavigationRoot.navigate(Constants.SCENES.GROUP.SELECT_CAMPUS, {
        isOnboarding,
        hideClose,
      })
    }
    return NavigationRoot.navigate(Constants.SCENES.GROUP.CREATE, {
      isOnboarding,
      hideClose,
    })
  }, [campuses.length, hideClose, isOnboarding])
}

export default CreateGroup
