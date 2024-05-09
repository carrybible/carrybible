import { H1 } from '@components/Typography'
import { App } from '@dts/app'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'

import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import I18n from '@shared/I18n'
import { wait } from '@shared/Utils'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

type ParamProps = {
  groupPlan: StudyPlan.GroupPlan
  isSharedOrgPlan?: boolean
}

type Props = StackScreenProps<{ StudyPublishingScreen: ParamProps }, 'StudyPublishingScreen'>

const StudyPublishingScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const Analytics = useAnalytic()

  const { groupPlan } = props.route.params
  const anim = useRef(new Animated.Value(0)).current
  const lottieStar = useRef<LottieView>(null)
  const lottieTick = useRef<LottieView>(null)

  // const modalRef = useRef<Modalize>(null)
  const [org, setOrg] = useState<App.Organisation | undefined | null>(undefined)

  const handlePublishAdvanceGoal = useCallback(
    async (orgData?: App.Organisation) => {
      Analytics.event(Constants.EVENTS.ADVANCED_GOAL.PUBLISH_STUDY)
      NavigationRoot.replace(Constants.SCENES.GROUP.SHARE, {
        groupId: group.id,
        navigateHome: true,
      })
    },
    [group, groupPlan],
  )

  useEffect(
    () => {
      const loadOrg = async () => {
        if (!group.organisation?.id) {
          return
        }
        try {
          const orgData = (await Firestore.Organisations.getOrganisation({
            organisationId: group.organisation.id,
          })) as App.Organisation
          setOrg(orgData)
          return orgData
        } catch (e) {
          setOrg(null)
        }
      }

      const fadeIn = () => {
        return new Promise(resolve => {
          Animated.timing(anim, {
            toValue: 1,
            easing: Easing.ease,
            duration: 1000,
            delay: 0,
            useNativeDriver: true,
          }).start(resolve)
        })
      }

      const lottieAnimation = async () => {
        await wait(500)
        lottieTick.current?.play()
        await wait(400)
        lottieStar.current?.play()
      }

      const runAnimation = async () => {
        await Promise.all([fadeIn(), lottieAnimation()])
        await wait(1500)
      }

      Promise.all([loadOrg(), runAnimation()]).then(async ([orgData]) => {
        await handlePublishAdvanceGoal(orgData)
      })
    },
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <View style={[s.container, { backgroundColor: color.background }]}>
      <LottieView ref={lottieStar} source={require('@assets/animations/stars.json')} style={s.lottie} loop speed={0.7} />
      <Animated.View
        style={[
          s.center,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}>
        <LottieView ref={lottieTick} source={require('@assets/animations/tick.json')} style={s.lottieTick} loop={false} speed={0.5} />
        <H1 style={s.text}>{I18n.t('text.Your plan was created')}</H1>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    marginBottom: 32,
  },
  lottieTick: {
    width: 126,
    height: 126,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 32,
  },
})

export default StudyPublishingScreen
