import Loading from '@components/Loading'
import { H1, Subheading, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import firestore from '@react-native-firebase/firestore'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import I18n from '@shared/I18n'
import React, { useEffect, useState } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import PreBuildBtn from './PreBuildBtn'

const HIDE_SMART_PLAN = true
const HIDE_ORG_PLAN = true

const SelectStudyType: React.FC<{ groupId: string }> = ({ groupId }) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)
  const { color } = useTheme()
  const Analytics = useAnalytic()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<App.Organisation>()

  const shouldRenderOrganisationPlanning = !HIDE_ORG_PLAN
  const shouldRenderSmartPlanning = !HIDE_SMART_PLAN

  const onPressQuickPlanning = () => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.CHOOSE_QUICK_START)
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.QUICK_STUDY_BOOK, { groupId })
  }

  const onPressSmartPlanning = () => {
    if (group.id && group.smartPlanAnswers) {
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.SMP_START_DATE, { groupId })
      return
    }
    Analytics.event(Constants.EVENTS.GOAL.START_SMART_PLANNER)
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.SMP_QUESTIONS)
  }

  const onPressOrganisationPlanning = () => {
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.SMP_START_DATE, {
      organisationId: onboarding.organisationId || group?.organisation?.id,
    })
  }

  const onPressCustomPlanning = async () => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.CHOOSE_ADVANCED)
    if (me.uid) {
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_LISTING)
    } else {
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_MAIN_BUILDER)
    }
  }

  useEffect(() => {
    const run = async () => {
      if (onboarding.organisationId || group?.organisation?.id) {
        const id = onboarding.organisationId || group?.organisation?.id
        if (id) {
          const orgResult = (await firestore().collection('organisations').doc(id).get()).data()
          setOrg(orgResult as App.Organisation)
          const memberOrgInfo = await Firestore.Organisations.getMemberOrgInfo(id, me.uid)

          // Check if have recommended studies
          // Original requirement: https://github.com/carrybible/carry-issues/issues/166
          const plans = (await Firestore.Organisations.getMobileOrgPlans(id)) as Array<any>
          const userCampuses = memberOrgInfo.data?.organisation.campusIds || []
          const userRole = memberOrgInfo.data?.organisation.role ?? ''
          // Logic here https://www.notion.so/Plan-Permissions-042b70292db74858979776e601b6a9e2
          const orgSharedPlans =
            (plans?.length &&
              plans.filter(
                plan =>
                  ['admin', 'owner'].includes(userRole) ||
                  (['campus-leader', 'campus-user', 'leader', 'member'].includes(userRole) &&
                    (!plan?.campus?.campusId || userCampuses?.includes(plan?.campus?.campusId))),
              )) ||
            []

          if (orgSharedPlans?.length) {
            NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.RECOMMENDED_STUDY, { orgResult, orgSharedPlans })
          }
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    run()
  }, [onboarding?.organisationId, group?.organisation?.id])

  if (loading) {
    return <Loading />
  }

  return (
    <View style={s.container}>
      <H1 bold style={s.title}>
        {I18n.t('text.lets get you started')}
      </H1>
      <ScrollView alwaysBounceVertical={false}>
        {shouldRenderOrganisationPlanning ? (
          <PreBuildBtn
            icon={<H1>📖</H1>}
            title={org?.name ? `${org?.name} plan` : I18n.t('text.Navigators plan')}
            description={I18n.t('text.Follow along with this plan created by your Navigators leaders', {
              nameValue: org?.name ? org?.name : 'Navigators',
            })}
            onPress={onPressOrganisationPlanning}
            colorIcon="white"
          />
        ) : null}

        {shouldRenderSmartPlanning ? (
          <PreBuildBtn
            icon={<H1>⚡️</H1>}
            title={I18n.t('text.Smart planning')}
            description={I18n.t('text.Let Carry create a smart study plan with engaging activities and discussion')}
            onPress={onPressSmartPlanning}
            colorIcon="white"
          />
        ) : null}

        <PreBuildBtn
          icon={<H1>🤖️️</H1>}
          title={I18n.t('text.Quick plan')}
          description={I18n.t('text.quick_plan_description')}
          onPress={onPressQuickPlanning}
          colorIcon="white"
        />

        <PreBuildBtn
          icon={<H1>🎨</H1>}
          title={I18n.t('text.Custom plan')}
          description={I18n.t('text.Build a plan from scratch by selecting various scriptures and activities for your group')}
          onPress={onPressCustomPlanning}
          colorIcon="white"
        />
        <View style={s.hintCotainer}>
          <Text style={s.textIcon}>🙌</Text>
          <View style={s.msgContainer}>
            <Image
              style={[s.msgBg, { tintColor: color.id === 'dark' ? `${color.gray5}AA` : undefined }]}
              resizeMode="stretch"
              source={require('@assets/images/chat.png')}
            />
            <Subheading>
              {I18n.t('text.If you d like to build a plan on  your desktop head to')}
              <Subheading color="blue"> dashboard.carrybible.com</Subheading>
            </Subheading>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginHorizontal: 20,
    marginVertical: 10,
    fontWeight: '800',
  },
  hintCotainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 20,
  },
  textIcon: { width: 75, fontSize: 50, marginTop: 40 },
  msgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 100,
    paddingHorizontal: 32,
  },
  msgBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 100,
  },
})
export default SelectStudyType
