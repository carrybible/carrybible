import Container from '@components/Container'
import Loading from '@components/Loading'
import { RootState } from '@dts/state'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { ConnectOrgScreen } from '@scenes/Common'
import { NavigationRoot } from '@scenes/root'
import Firestore from '@shared/Firestore'
import { Config, Constants } from '@shared/index'
import React, { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { TabView } from 'react-native-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import Translation from './Translation'
import UpdateProfile from './UpdateProfile'
import { App } from '@dts/app'

type Props = StackScreenProps<
  {
    Questions: {
      groupId: string
      personalInfo?: {
        name?: string
        phone?: string
      }
      skipOnboardingSlides?: boolean
    }
  },
  'Questions'
>

const Questions: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const translations = useSelector<RootState, RootState['translations']>(s => s.translations)
  const dim = useWindowDimensions()
  const [tabState, setTabState] = useState<{
    index: number
    routes: { key: string }[]
  }>({ index: 0, routes: [] })
  const [orgOfGroup, setOrgOfGroup] = useState<App.Organisation>()

  const isNewAccount = !me.translation
  const { groupId, personalInfo, skipOnboardingSlides } = props.route.params

  const checkingData = async () => {
    const routes: { key: string }[] = []
    if (!me.name || !me.image || isNewAccount) {
      routes.push({ key: 'profile' })
    }
    const group = (await Firestore.Group.getGroup({ groupId })) as App.Group
    if (group.organisation?.id) {
      const org = (await Firestore.Organisations.getOrganisation({ organisationId: group.organisation.id })) as App.Organisation
      if (org.isRequirePhone) {
        setOrgOfGroup(org)
        routes.push({ key: 'connect' })
      }
    }
    if (!me.translation || (!translations.remote.find(trans => trans.abbr === me.translation?.toLowerCase()) && !me.translationId)) {
      routes.push({ key: 'translation' })
    }
    if (routes.length === 0) {
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: props.route.params.groupId })
      NavigationRoot.home()
    } else {
      setTabState({ routes, index: 0 })
    }
  }

  useEffect(() => {
    checkingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onIndexChange = (index: number) => {
    setTabState({ ...tabState, index })
  }

  const onPressContinue = () => {
    if (tabState.index >= tabState.routes.length - 1) {
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
      if (skipOnboardingSlides) {
        NavigationRoot.home()
      } else {
        if (Config.VARIANT === 'carry') NavigationRoot.navigate(Constants.SCENES.ONBOARDING.INFORMATION)
      }
    } else {
      setTabState({ ...tabState, index: tabState.index + 1 })
    }
  }

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'profile': {
        return <UpdateProfile onPressContinue={onPressContinue} initValue={me.name || personalInfo?.name || ''} />
      }
      case 'translation': {
        return <Translation onPressContinue={onPressContinue} />
      }
      case 'connect': {
        // @ts-ignore
        return <ConnectOrgScreen onPressContinue={onPressContinue} org={orgOfGroup} />
      }
      default:
        return null
    }
  }

  return (
    <Container safe>
      {tabState.routes.length === 0 ? (
        <Loading />
      ) : (
        <TabView
          navigationState={tabState}
          renderTabBar={() => null}
          renderScene={renderScene}
          onIndexChange={onIndexChange}
          initialLayout={{ width: dim.width }}
          // swipeEnabled={false}
        />
      )}
    </Container>
  )
}

Questions.defaultProps = {}

export default Questions
