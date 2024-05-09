import Container from '@components/Container'
import { Title } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { OnboardingState } from '@redux/reducers/onboarding'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import { delay } from '@shared/Utils'
import I18n from 'i18n-js'
import * as React from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import BuildItem from './components/BuildItem'
import SMPLoading from './components/SMPLoading'

const SmartPlanBuilding: React.FC = props => {
  const organisationId = props?.route?.params?.organisationId || ''
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const dispatch = useDispatch()
  const onboarding = useSelector<any, OnboardingState>(s => s.onboarding)
  const [item1st, setItem1st] = React.useState<boolean>(false)
  const [item2nd, setItem2nd] = React.useState<boolean>(false)
  const [item3rd, setItem3rd] = React.useState<boolean>(false)
  const [item4th, setItem4th] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const isCreateDone = React.useRef(false)
  const fromQuestion = React.useRef(true)

  React.useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (organisationId) {
        getPlan()
      } else {
        setItem1st(true)
        initItem()
      }
    })
  }, [])

  const initItem = async () => {
    await getPlan()

    await delay(3500)
    setItem2nd(true)
    await delay(4500)
    setItem3rd(true)
    await delay(4500)
    setItem4th(true)
    await delay(4000)
    navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_CONFIRM, { organisationId })
  }

  const loadingComplete = () => {
    if (isCreateDone.current) {
      navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_CONFIRM, { organisationId })
    } else {
      isCreateDone.current = true
    }
  }

  const getPlan = async () => {
    fromQuestion.current = true
    let smartPlanAnswers = onboarding.responses?.reduce?.((pre, cur) => {
      return { ...pre, [cur.questionID]: cur.answerID }
    }, {})

    if (me.uid && me.streamToken && group.id) {
      // User logged
      if (!group.smartPlanAnswers) {
        // User just answer questions, save them to user
        await Firestore.Group.updateGroup({ smartPlanAnswers }, group.id)
      } else {
        // User already answer questions, get from server
        smartPlanAnswers = group.smartPlanAnswers
        fromQuestion.current = false
      }
    }
    const response = await Firestore.Study.getSmartPlan(
      smartPlanAnswers,
      group?.id || '',
      (onboarding.startDate || new Date())?.getTime(),
      organisationId,
    )
    if (!response) {
      toast.error(I18n.t('error.Can not get plan'))
      navigation.pop()
      return
    }
    const newPlan = response as StudyPlan.GroupPlan
    setLoading(false)
    dispatch({ type: TYPES.ONBOARDING.SET_SMART_PLAN, response: newPlan })
    if (isCreateDone.current) {
      navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_CONFIRM, { organisationId })
    } else {
      isCreateDone.current = true
    }
  }

  return organisationId ? (
    <Container safe>
      <View style={{ width: Metrics.screen.width, height: Metrics.screen.height }}>
        <SMPLoading style={s.smpLoading} onComplete={loadingComplete} isOrg={true} />
        <View style={s.footer} />
      </View>
    </Container>
  ) : (
    <Container safe>
      <Title style={s.title}>{I18n.t('text.Building a plan for your group')}</Title>
      <View style={s.contentContainer}>
        {item1st ? (
          <BuildItem
            runningText={I18n.t('text.Searching through Scriptures')}
            icon="📖"
            title={I18n.t('text.Study')}
            desc={onboarding?.smartPlan?.summary?.passage || onboarding?.smartPlan?.name || ''}
            manualRun={true}
            canEnd={!loading}
          />
        ) : null}
        {item2nd ? (
          <BuildItem
            runningText={I18n.t('text.Generating engaging prompts')}
            icon="💬"
            title={I18n.t('text.Discussion')}
            desc={onboarding?.smartPlan?.summary?.question || I18n.t('text.Daily questions')}
            showVerticalLine
          />
        ) : null}

        {item3rd ? (
          <BuildItem
            runningText={I18n.t('text.Sprinkling in connection points')}
            icon="🙏"
            title={I18n.t('text.Group Prayer')}
            desc={onboarding?.smartPlan?.summary?.prayer || I18n.t(`text.Requests and responses`)}
            showVerticalLine
          />
        ) : null}

        {item4th ? (
          <BuildItem
            runningText={I18n.t('text.Adding in space to celebrate')}
            icon="🎉"
            title={I18n.t('text.Gratitude journaling')}
            desc={onboarding?.smartPlan?.summary?.gratitude || I18n.t('text.Sharing and celebrating')}
            showVerticalLine
          />
        ) : null}
      </View>
    </Container>
  )
}

const s = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginHorizontal: 53,
    marginTop: 15,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  smpLoading: {
    flex: 8,
  },
  footer: {
    flex: 2,
  },
})

export default SmartPlanBuilding
