import useTheme from '@hooks/useTheme'
import Firestore from '@shared/Firestore'
import * as React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import Avatar from './Avatar'
import Loading from './Loading'
import { Text } from './Typography'

interface Props {
  members: Array<string>
  style: StyleProp<ViewStyle>
  avatarSize?: number
  full?: boolean
  disabled?: boolean
}

const MemberInGroupAvatar: React.FC<Props> = props => {
  const { color } = useTheme()
  const { avatarSize = 35 } = props
  const [listAvatar, setListAvatar] = React.useState<Array<string>>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  React.useEffect(() => {
    getMembersAvatar()
  }, [props.members])

  const getMembersAvatar = async () => {
    setLoading(true)
    const listAvatar = Array<string>()
    for (let i = 0; i < props.members.length; i += 1) {
      if (i > 4) break
      const memberInfo = await Firestore.User.getUserWithoutAuth({ uid: props.members[i] })
      listAvatar.push(memberInfo?.image)
    }
    setListAvatar(listAvatar)
    setLoading(false)
  }
  const moreMemberLength = props.members?.length - 5
  if (loading) {
    return (
      <View style={[s.container, props.style]}>
        <Loading />
      </View>
    )
  }
  return (
    <View style={[!props.full && s.container, props.style]}>
      {listAvatar.map((item, index) => (
        <View key={index} style={[!props.full && s.avatarContainer, props.full && s.avatarFullContainer, { borderColor: color.middle }]}>
          <Avatar pressable={!props.disabled} url={item} key={item} size={avatarSize} />
        </View>
      ))}
      {moreMemberLength > 0 && !props.full ? (
        <Text bold style={s.moreMemberText}>
          +{moreMemberLength}
        </Text>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  avatarContainer: {
    borderWidth: 3,
    borderRadius: 35,
    marginLeft: -10,
  },
  avatarFullContainer: {
    marginLeft: 17,
    marginVertical: 6,
  },
  moreMemberText: {
    marginLeft: 2,
  },
})

export default MemberInGroupAvatar
