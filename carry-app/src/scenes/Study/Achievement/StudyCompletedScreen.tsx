import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import { H1, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useTheme from '@hooks/useTheme'
import { RouteProp } from '@react-navigation/native'
import { TYPES } from '@redux/actions'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import I18n from '@shared/I18n'
import LottieView from 'lottie-react-native'
import React, { FC, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'

interface Props {
  route: RouteProp<Params, 'screen'>
}

type Params = {
  screen: {
    plan: StudyPlan.GroupPlan
    blockIndex: number
  }
}

const StudyCompleted: FC<Props> = props => {
  const dispatch = useDispatch()
  const { plan, blockIndex } = props.route.params
  const anim = useRef(new Animated.Value(0)).current
  const { color } = useTheme()
  const lottieTick = useRef()
  const lottie = useRef()
  const [fadeInOpacityButton, translateY] = useFadeInUp(500, 500)
  const Analytics = useAnalytic()

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.STUDY_COMPLEED_SCREEN)
    setTimeout(() => {
      lottieTick.current?.play()
    }, 500)
    setTimeout(() => {
      lottie.current?.play()
    }, 900)
    Animated.timing(anim, {
      toValue: 1,
      easing: Easing.back(),
      duration: 1000,
      delay: 0,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <Container safe style={{ flex: 1, backgroundColor: color.background }}>
      <View style={[s.container, { backgroundColor: color.background }]}>
        <LottieView ref={lottie} source={require('@assets/animations/stars.json')} style={[s.lottie]} loop speed={0.7} />
        <Animated.View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            marginTop: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }}
        >
          <LottieView
            ref={lottieTick}
            source={require('@assets/animations/award_advanced.json')}
            style={[s.lottieTick]}
            loop={false}
            speed={1}
          />
          <H1 style={{ marginTop: 42 }}>{I18n.t('text.bible completed', { number: blockIndex })}</H1>
          <Text style={{ textAlign: 'center', maxWidth: '70%', marginTop: 30 }}>
            {I18n.t('text.bible complete message', { name: plan.name })}
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={{ width: '100%', opacity: fadeInOpacityButton, transform: [{ translateY: translateY }] }}>
        <BottomButton
          backgroundColor="lavender"
          textColor="accent"
          title={I18n.t('text.View reward')}
          rounded
          onPress={() => {
            dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: plan.targetGroupId })
            props.navigation.popToTop()
            props.navigation.navigate(Constants.SCENES.GROUP_HOME)
          }}
        />
        <BottomButton
          title={I18n.t('text.Continue')}
          rounded
          onPress={() => {
            props.navigation.pop()
          }}
        />
      </Animated.View>
    </Container>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: { marginBottom: 78 },
  lottieTick: { width: 126, height: 126 },
})

export default StudyCompleted
