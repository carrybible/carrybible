import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import InAppNotification from '@components/InAppNotification'
import Text from '@components/Typography/Text'
import { RootState } from '@dts/state'
import useActionStepFeature from '@hooks/useActionStepFeature'
import useTheme from '@hooks/useTheme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import firestore from '@react-native-firebase/firestore'
import remoteConfig from '@react-native-firebase/remote-config'
import { StackScreenProps } from '@react-navigation/stack'
import { useNavigateToCreateGroupScreen } from '@scenes/GroupCreation/CreateGroupScreen'
import { NavigationRoot } from '@scenes/root'
import collections from '@shared/Firestore/collections'
import { Branch, Constants, Database, Firestore } from '@shared/index'
import React, { useState } from 'react'
import { ScrollView, Share } from 'react-native'
import { useSelector } from 'react-redux'

import { Header, ItemButton, ItemNavigate, ItemSwitch } from './components/CommonItems'
import RecommendedPlan from './mocks/RecommendedPlan.json'

type ParamProps = {
  // reserved
}

type Props = StackScreenProps<{ ForbiddenZoneHomeScreen: ParamProps }, 'ForbiddenZoneHomeScreen'>

const ForbiddenZoneHomeScreen: React.FC<Props> = () => {
  const { color, changeTheme } = useTheme()
  const [isReadFull, setReadFull] = useState(false)

  const { hasActionStepFeature, onToggleActionStep } = useActionStepStatus()
  const onboarding = useSelector<RootState, RootState['onboarding']>(s => s.onboarding)
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const addMockRecommenedPlan = async () => {
    const mockData = RecommendedPlan
    await Firestore.Organisations.addRecommendedOrgPlan(onboarding.organisationId || group?.organisation?.id || '', mockData)
  }

  const navigateToCreateGroup = useNavigateToCreateGroupScreen()

  return (
    <Container safe>
      <HeaderBar
        title={'Forbidden Zone'}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        borderedBottom
      />
      <ScrollView alwaysBounceVertical={false}>
        <Text
          numberOfLines={!isReadFull ? 2 : undefined}
          onPress={() => {
            setReadFull(true)
          }}>
          Welcome to ForbiddenZone page! This page contains utility functions for Dev/Beta app and will <Text bold>NOT</Text> appear on
          Production app. To hide the forbidden zone entry button (small bug circle button on the middle right edge of the screen) just need
          to long press on it
        </Text>

        <Header title="Dev utilities" />
        <ItemButton
          title={'Clear local storage'}
          btnTitle={'Clear'}
          onPress={() => {
            AsyncStorage.clear()
            toast.success('Clear storage successfully')
          }}
        />
        <ItemButton
          title={'Close Database'}
          btnTitle={'Close'}
          onPress={() => {
            Database.close()
            toast.success('Close database successfully')
          }}
        />
        <ItemButton
          title={'Set wrong Database file path'}
          btnTitle={'Make it wrong!!!'}
          onPress={() => {
            Database.close()
            Database.file = 'unknown.carry'
            toast.success('Set database wrong path successfully')
          }}
        />
        <ItemSwitch
          title={'Dark mode'}
          value={color.id === 'dark'}
          onChange={() => {
            const newTheme = color.id === 'dark' ? 'light' : 'dark'
            changeTheme(newTheme)
          }}
        />
        <Header title="Navigator shortcut" />
        <ItemNavigate
          title={'Request Notification Permission'}
          onPress={() => {
            NavigationRoot.push(Constants.SCENES.ONBOARDING.ADD_NOTIFICATION, { onContinue: () => null })
          }}
        />
        <ItemNavigate
          title={'Open Save streak modal'}
          onPress={() => {
            NavigationRoot.navigate(Constants.SCENES.MODAL.SAVE_STREAK, {
              onStartStudyPlan: () => {
                // do nothing
              },
            })
          }}
        />
        <ItemNavigate
          title={'Navigate to Leader Prompt Screen'}
          onPress={async () => {
            NavigationRoot.push(Constants.SCENES.LEADER_PROMPTS, {
              tip: {
                title: 'title',
                content: 'content',
              },
              video: 'videos/The basics _ Why should I use Carry_.mp4',
            })
          }}
        />
        <ItemNavigate
          title={'Navigate to Onboarding Video'}
          onPress={async () => {
            NavigationRoot.push(Constants.SCENES.ONBOARDING.VIDEO)
          }}
        />
        <ItemNavigate
          title={'Navigate to Connect With Org Screen'}
          onPress={async () => {
            NavigationRoot.navigate(Constants.SCENES.COMMON.CONNECT_WITH_ORG, {
              isEditProfile: true,
            })
          }}
        />
        <ItemNavigate
          title={'Navigate to Remind Next Plan'}
          onPress={async () => {
            NavigationRoot.push(Constants.SCENES.STUDY_PLAN.REMIND_NEXT_STUDY)
          }}
        />
        <ItemNavigate
          title={'Navigate to Group Create Screen'}
          onPress={async () => {
            navigateToCreateGroup()
          }}
        />
        <Header title="Others..." />
        <ItemSwitch
          title={'Toggle action step feature for current group'}
          value={hasActionStepFeature}
          onChange={async () => {
            await onToggleActionStep()
            toast.success('Updated successfully')
          }}
        />
        <ItemButton
          title={'Remote config clear cache'}
          btnTitle={'Clear'}
          onPress={async () => {
            await remoteConfig().fetch(0)
            await remoteConfig().activate()
            toast.success('Clear remote config cache successfully')
          }}
        />
        {onboarding.organisationId || group?.organisation?.id ? (
          <ItemButton
            title={'Add mock recommended org plan'}
            btnTitle={'Add'}
            onPress={async () => {
              // AsyncStorage.clear()
              await addMockRecommenedPlan()
              toast.success('Added recommended Plan')
            }}
          />
        ) : null}
        <ItemButton
          title={'Generate Prayer Share Link'}
          btnTitle={'Get'}
          onPress={async () => {
            const url = await Branch.createOpenPrayerShareLink(group.id)
            await Share.share({
              title: 'Open prayer share link',
              message: url,
            })
          }}
        />
        <ItemButton
          title={'Open in app notification'}
          btnTitle={'Open'}
          onPress={async () => {
            InAppNotification.show({
              title: 'In app message here',
              text: 'There is not thing for the....',
              onPress: () => {
                devLog('press done')
              },
            })
          }}
        />
      </ScrollView>
    </Container>
  )
}

const useActionStepStatus = () => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const hasActionStepFeature = useActionStepFeature()
  const onToggleActionStep = async () => {
    try {
      await firestore().collection(collections.GROUPS).doc(group.id).set(
        {
          hasActionStepFeature: !hasActionStepFeature,
        },
        { merge: true },
      )
    } catch (e) {
      console.error(e)
    }
  }
  return {
    hasActionStepFeature,
    onToggleActionStep,
  }
}

export default ForbiddenZoneHomeScreen
