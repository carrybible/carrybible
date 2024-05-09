import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import Loading from '@components/Loading'
import { H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import storage from '@react-native-firebase/storage'
import { useNavigation } from '@react-navigation/native'
import { OnboardingState } from '@redux/reducers/onboarding'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import Utils from '@shared/Utils'
import I18n from 'i18n-js'
import * as React from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import Video from 'react-native-video'
import { useSelector } from 'react-redux'
import OverlappedPlanModal, { OverlappedPlanModalize } from './components/OverlappedPlanModal'

interface Props {
  navigation: any
  route: any
}

const SmartPlanConfirm: React.FC<Props> = props => {
  const organisationId = props?.route?.params?.organisationId || ''
  const onboarding = useSelector<any, OnboardingState>(s => s.onboarding)
  const overlappedPlanModalRef = React.useRef<OverlappedPlanModalize>(null)
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [loading, setLoading] = React.useState(false)
  const navigation = useNavigation<any>()
  const [videoLoading, setVideoLoading] = React.useState(false)
  const [showVideo, setShowVideo] = React.useState(false)
  const [videoUrl, setVideoUrl] = React.useState('')
  const { color } = useTheme()
  const Analytics = useAnalytic()

  React.useEffect(() => {
    getVideo()
    InteractionManager.runAfterInteractions(() => {
      setShowVideo(true)
    })
  }, [])

  const getVideo = async () => {
    const path = color.id === 'dark' ? onboarding?.smartPlan?.preview?.pathDark : onboarding?.smartPlan?.preview?.pathLight
    const url = await storage().ref(path).getDownloadURL()
    setVideoUrl(url)
  }

  const onPressLooksGood = async () => {
    Analytics.event(Constants.EVENTS.GOAL.START_SMART_PLANNER)
    if (me.uid && me.streamToken) {
      setLoading(true)
      const checkOverlapResp = await Firestore.Study.checkOverlapPlans(
        group.id,
        onboarding.startDate?.getTime(),
        onboarding.smartPlan?.duration,
        onboarding.smartPlan?.pace,
      )
      if (!checkOverlapResp.data?.length) {
        await addPlan()
        setLoading(false)
        NavigationRoot.home()
      } else {
        // Have plans overlapped
        const overlappedCurrent = checkOverlapResp.data.some(i => i.id === group?.activeGoal?.id)
        overlappedPlanModalRef.current?.open?.(!overlappedCurrent ? 'future' : 'current')
      }
    } else {
      NavigationRoot.navigate(Constants.SCENES.ONBOARDING.LOGIN, {
        isCreateGroup: true,
        groupInfo: {
          id: onboarding.groupId,
          name: onboarding.groupName,
          avatar: onboarding.groupAvatar?.url,
          members: [],
        },
      })
    }
  }

  const addPlan = async () => {
    await Firestore.Study.applyStudyPlanToGroup(
      group?.id || '',
      {
        ...onboarding.smartPlan,
        author: me.uid,
        owner: me.uid,
        targetGroupId: group?.id,
      },
      onboarding.startDate,
    )
    const planRef = Firestore.Study.planCollectionref(group.id)
    await Utils.checkScheduleFuturePlan(planRef, group)
  }

  const onPressCustom = () => {
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.QUICK_STUDY_BOOK, {
      skippable: true,
      isNormalGroup: true,
    })
  }

  const onPressConfirmOverlap = async () => {
    overlappedPlanModalRef.current?.close?.()
    await addPlan()
    setLoading(false)
    NavigationRoot.home()
  }

  const onPressCancelOverlap = () => navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_START_DATE)

  return (
    <>
      <Container style={s.container} safe>
        <H1 style={s.title}>
          {organisationId ? I18n.t('text.Your group is good to go') : I18n.t('text.We created this plan for your group')}
        </H1>
        <View style={s.suggestionContainer}>
          {onboarding.responses?.map((value, index) => {
            return (
              <Text style={s.text} color="gray" key={index}>
                {`✔️ ${value.result}`}
              </Text>
            )
          })}
        </View>
        <View style={s.videoContainer} pointerEvents="none">
          {showVideo && videoUrl ? (
            <>
              <Video
                source={{ uri: videoUrl }} // Can be a URL or a local file.
                repeat={true}
                style={s.backgroundVideo}
                resizeMode="contain"
                onLoadStart={() => setVideoLoading(true)}
                onReadyForDisplay={() => setVideoLoading(false)}
              />
              {videoLoading ? (
                <View style={s.videoLoading}>
                  <Loading />
                </View>
              ) : null}
            </>
          ) : (
            <Loading />
          )}
        </View>
        <BottomButton
          title={I18n.t('text.Looks good to me')}
          rounded
          avoidKeyboard={true}
          keyboardVerticalOffset={50}
          onPress={onPressLooksGood}
          loading={loading}
        />
        <BottomButton
          backgroundColor={color.middle}
          title={I18n.t('text.Or build your own plan')}
          rounded
          avoidKeyboard={true}
          keyboardVerticalOffset={50}
          textColor="gray3"
          onPress={onPressCustom}
          loading={loading}
        />
      </Container>
      <OverlappedPlanModal ref={overlappedPlanModalRef} onPressConfirm={onPressConfirmOverlap} onPressCancel={onPressCancelOverlap} />
    </>
  )
}

const s = StyleSheet.create({
  container: {
    // alignItems: 'center'
  },
  title: {
    marginTop: 40,
    textAlign: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '80%',
  },
  suggestionContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  text: {
    marginTop: 3,
    marginHorizontal: Metrics.insets.horizontal,
    textAlign: 'center',
  },
  backgroundVideo: {
    flex: 1,
    transform: [
      {
        scale: 0.9,
      },
    ],
  },
  videoContainer: {
    flex: 1,
  },
  videoLoading: {
    position: 'absolute',
    flex: 1,
    ...StyleSheet.absoluteFill,
  },
})

export default SmartPlanConfirm
