import Avatar from '@components/Avatar'
import Container from '@components/Container'
import { H1, Text, Title } from '@components/Typography'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useTheme from '@hooks/useTheme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Firestore from '@shared/Firestore'
import { wait } from '@shared/Utils'
import React, { FC, useEffect, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
type Props = any
const DayIntro: FC<Props> = props => {
  const { color } = useTheme()
  const [listAvatar, setListAvatar] = useState<Array<string>>([])

  const { onConfirm, plan, blockIndex } = props.route.params
  const [fadeInOpacity, translateY, animate] = useFadeInUp(600, undefined, undefined, false)
  useEffect(() => {
    const run = async () => {
      const showedArrJson = await AsyncStorage.getItem('DayIntroShowed')
      const showedArr = (showedArrJson && JSON.parse(showedArrJson)) || []
      showedArr.push(`${plan.id}-${blockIndex}`)
      await AsyncStorage.setItem('DayIntroShowed', JSON.stringify(showedArr))
      setTimeout(() => {
        onConfirm()
      }, 2000)
      if (plan?.memberProgress && Object.keys(plan.memberProgress)?.length) {
        const memberIds = Object.keys(plan.memberProgress)

        const list = Array<string>()
        for (let i = 0; i < memberIds.length; i += 1) {
          if (i > 4 || !plan?.memberProgress[memberIds[i]].isCompleted) break
          const memberInfo = await Firestore.User.getUserWithoutAuth({ uid: memberIds[i] })
          list.push(memberInfo?.image)
        }
        setListAvatar(list)
      }
    }
    const startAnimation = async () => {
      await wait(300)
      animate()
    }
    run()
    startAnimation()
  }, [plan])

  const moreMemberLength = Object.keys(listAvatar).length - 5

  return (
    <Container safe={true} forceInset={{ bottom: true, top: true }} backgroundColor={color.id === 'light' ? '#fafafa' : color.background}>
      <View style={styles.container}>
        <Animated.View style={[styles.animatedView, { opacity: fadeInOpacity, transform: [{ translateY: translateY }] }]}>
          {plan.featuredImage ? (
            <Avatar url={plan.featuredImage} size={109} loading={false} pressable={false} />
          ) : (
            <View style={styles.iconContainer}>
              <Title style={styles.iconText}>💡</Title>
            </View>
          )}
          <H1 style={styles.nameText}>{plan?.name || ''}</H1>
          {plan && blockIndex ? (
            <Text style={styles.dayName} bold color="gray4">
              {plan?.blocks[blockIndex - 1]?.name || ''}
            </Text>
          ) : null}
          <View style={styles.listAvatarContainer}>
            {listAvatar.map((item, index) => (
              <View key={index} style={[styles.avatarContainer, { borderColor: color.middle }]}>
                <Avatar url={item} key={item} size={30} />
              </View>
            ))}
            {moreMemberLength > 0 ? (
              <Text bold style={styles.moreMemberText}>
                +{moreMemberLength}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    width: 109,
    height: 109,
    borderRadius: 54.5,
    justifyContent: 'center',
    backgroundColor: '#d0ddff',
  },
  iconText: {
    fontSize: 36,
  },
  avatarContainer: {
    borderWidth: 3,
    borderRadius: 35,
    marginLeft: -10,
  },
  moreMemberText: {
    marginLeft: 2,
  },
  listAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginTop: 25,
  },
  nameText: {
    marginTop: 25,
  },
  dayName: {
    marginTop: 8,
  },
  animatedView: {
    alignItems: 'center',
  },
})

export default DayIntro
