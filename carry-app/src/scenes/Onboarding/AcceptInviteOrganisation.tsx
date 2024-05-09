/* eslint-disable no-unused-vars */
import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import Loading from '@components/Loading'
import { H1, Text } from '@components/Typography'
import Group from '@dts/group'
import { RootState } from '@dts/state'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useTheme from '@hooks/useTheme'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import IconButton from '@scenes/Launch/components/IconButton'
import { NavigationRoot } from '@scenes/root'
import Firestore from '@shared/Firestore'
import { Constants, Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import * as React from 'react'
import { Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

interface Props {
  navigation: StackNavigationProp<any>
  route: {
    params: { invitation: App.Codes }
  }
}

const AcceptInviteOrganisation: React.FC<Props> = props => {
  const { color: theme } = useTheme()

  const [groupName, setGroupName] = React.useState('')
  const [groupAvatar, setGroupAvatar] = React.useState('')
  const [groups, setGroups] = React.useState<Array<Group>>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const [isJoining] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const lottieStars = React.useRef(null)
  const lottieGroup = React.useRef(null)
  const dispatch = useDispatch()
  const me = useSelector<RootState, App.User>(state => state.me)

  const invitation = props.route?.params?.invitation

  const [fadeInOpacityAvatar, translateYAvatar, runShowAvatar] = useFadeInUp(600, undefined, undefined, false)
  const [fadeInOpacityButton, translateYButton, runShowButton] = useFadeInUp(600, undefined, undefined, false)
  const [fadeInOpacityContent, transY, runShowContent] = useFadeInUp(600, undefined, undefined, false)

  React.useEffect(() => {
    getOrgInfo()
    playAnimation()
  }, [])

  const getOrgInfo = async () => {
    setLoading(true)
    const organisation = await Firestore.Organisations.getOrganisation({ organisationId: invitation.organisationId })
    setGroupAvatar(organisation?.image)
    setGroupName(organisation?.name)
    const listGroup = (await Firestore.Organisations.getSharedGroupFromCode(invitation)) as Array<Group>
    const filterGroup = (listGroup?.length && listGroup.filter(i => !i.members.includes(me.uid))) || []
    setGroups(filterGroup)
    setLoading(false)
    runShowAvatar()
    setTimeout(() => {
      runShowButton()
      runShowContent()
    }, 1700)
  }

  React.useEffect(() => {
    if (isJoining) {
      playAnimation()
    }
  }, [isJoining])

  const onPressContinue = async () => {
    // Accept invitation
    if (selectedIndex === -1) {
      return
    }
    const { id: groupId, name, image, members } = groups[selectedIndex]
    // Case logged in, join group directly and jump to home screen
    if (me.uid) {
      setLoading(true)
      const joinGroupResult = await Firestore.User.requestJoinGroup(groupId)
      if (!joinGroupResult.success) {
        setLoading(false)
        toast.error(I18n.t('text.Group is full'))
        return
      }
      setLoading(false)
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
      NavigationRoot.home({ fromInvitation: true })
      return
    }

    // Case not logged in, need to store data to onboarding state
    dispatch({ type: TYPES.ONBOARDING.SET_GROUP_ID, groupId })
    NavigationRoot.navigate(Constants.SCENES.ONBOARDING.LOGIN, {
      isCreateGroup: false,
      groupInfo: {
        id: groupId,
        name: name,
        avatar: image,
        members,
      },
    })
  }

  const keyExtractor = (i, index) => i.id + index

  const playAnimation = () => {
    lottieGroup.current?.play()
    lottieStars.current?.play()
  }

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[s.itemContainer, { backgroundColor: theme.middle, borderColor: index === selectedIndex ? theme.accent : theme.middle }]}
        onPress={() => setSelectedIndex(index)}
      >
        <Avatar url={item.image} size={40} name={item.name} loading={false} />
        <Text style={s.itemName}>{item.name}</Text>
      </TouchableOpacity>
    )
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

      <>
        <FlatList
          ListHeaderComponent={
            <View style={s.container}>
              <>
                <Animated.View style={{ opacity: fadeInOpacityAvatar, transform: [{ translateY: translateYAvatar }] }}>
                  <Avatar url={groupAvatar} size={120} name={groupName} loading={false} borderWidth={3} borderColor={theme.gray7} />
                </Animated.View>
                <Animated.View style={[{ opacity: fadeInOpacityContent }, s.center]}>
                  <H1 style={s.groupNameText}>{groupName}</H1>
                </Animated.View>
              </>
            </View>
          }
          contentContainerStyle={s.flatList}
          data={groups}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      </>
      <BottomButton title={I18n.t('text.Continue')} rounded disabled={selectedIndex === -1} onPress={onPressContinue} />
    </Container>
  )
}

const s = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  center: { alignItems: 'center' },

  removeMargin: { marginBottom: 0 },

  groupNameText: {
    marginTop: 5,
    marginBottom: 5,
    textAlign: 'center',
    marginHorizontal: '10%',
  },
  flatList: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    marginHorizontal: Metrics.insets.horizontal,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: 12.5,
    marginTop: Metrics.insets.top,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    ...Styles.shadow2,
  },
  itemName: {
    marginHorizontal: 16,
    flex: 1,
  },
})

export default AcceptInviteOrganisation
