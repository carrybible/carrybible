import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { H1 } from '@components/Typography'
import { RootState } from '@dts/state'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import I18n from 'i18n-js'
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import PlanList from './PlanList'

type ParamProps = {
  //reserved
}

type Props = StackScreenProps<{ StudyListingScreen: ParamProps }, 'StudyListingScreen'>

const StudyListingScreen: React.FC<Props> = () => {
  const { color } = useTheme()
  const { custom } = useLayoutAnimation()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string; title: string }[] = [{ key: 'my-plan', title: I18n.t('text.MY PLANS') }]
    return {
      index: 0,
      routes,
    }
  })
  const { landscape } = useScreenMode()

  useEffect(
    () => {
      const run = async () => {
        if (group.organisation?.id && navigationState.routes.length === 1) {
          const orgData = (await Firestore.Organisations.getOrganisation({
            organisationId: group.organisation.id,
          })) as App.Organisation
          custom()
          setNavigationState({
            ...navigationState,
            routes: [
              ...navigationState.routes,
              {
                key: 'org-plan',
                title: I18n.t('text.org plan', { orgName: orgData.name }),
              },
            ],
          })
        }
      }
      run()
    }, // load once when init
    [],
  )

  const handleIndexChange = React.useCallback(
    (index: number) => {
      setNavigationState({ ...navigationState, index })
    },
    [navigationState],
  )

  const handleCreateNewPlan = async () => {
    const draft = await Firestore.Study.createAdvancedStudyDraft(group.id, 'day')
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_MAIN_BUILDER, { draft })
  }

  const ListView = useMemo(() => {
    return (
      <View style={styles.tabViewContainer}>
        <PlanList
          loadPlan={async () => {
            return await Firestore.Study.getUserAdvancedPlans(me.uid)
          }}
        />
      </View>
    )
  }, [handleIndexChange, navigationState, color, group?.organisation?.id, me?.uid])

  const Title = useMemo(
    () => (
      <H1 align="center" style={styles.title}>
        {I18n.t('text.Use an existing plan or create a new plan from scratch')}
      </H1>
    ),
    [],
  )

  const Button = useMemo(
    () => <BottomButton title={I18n.t('text.Create a new plan')} rounded={true} onPress={handleCreateNewPlan} />,
    [handleCreateNewPlan],
  )

  if (landscape)
    return (
      <Container safe>
        <HeaderBar
          iconLeft={'chevron-thin-left'}
          iconLeftFont={'entypo'}
          colorLeft={color.text}
          iconLeftSize={22}
          onPressLeft={() => {
            NavigationRoot.pop()
          }}
        />
        <ScreenView separateHorizontal>
          <View style={styles.flex}>
            <View style={styles.flexCenter}>{Title}</View>
            {Button}
          </View>
          {ListView}
        </ScreenView>
      </Container>
    )
  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      {Title}
      {ListView}
      {Button}
    </Container>
  )
}

const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
    marginTop: 25,
  },
  flex: {
    flex: 1,
  },
  flexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
    marginTop: 33,
  },
})

export default StudyListingScreen
