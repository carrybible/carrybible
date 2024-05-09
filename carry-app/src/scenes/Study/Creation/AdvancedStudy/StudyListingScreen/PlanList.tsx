import EmptyData from '@components/EmptyData'
import Loading from '@components/Loading'
import { H2, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'

const PlanItem = ({ plan }: { plan: StudyPlan.UserPlan }) => {
  const { color } = useTheme()
  const { name, duration } = plan
  return (
    <TouchableOpacity
      style={[
        styles.planItemWrapper,
        {
          backgroundColor: color.background,
          borderColor: color.whiteSmoke,
          ...(color.id === 'light' ? Styles.shadow2 : Styles.shadowDark),
        },
      ]}
      onPress={() => {
        NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_MAIN_BUILDER, { plan })
      }}>
      <Image
        source={plan.featuredImage ? { uri: plan.featuredImage } : require('@assets/images/img-no-plan.png')}
        style={styles.planImage}
      />
      <View style={styles.itemInfo}>
        <H2 numberOfLines={2}>{name || I18n.t('text.Untitled plan')}</H2>
        <Text style={styles.durationText}>
          {duration} {duration > 1 ? I18n.t(`text.${plan.pace}s`) : I18n.t(`text.${plan.pace}`)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const PlanList = ({ loadPlan }: { loadPlan: () => Promise<StudyPlan.UserPlan[]> }) => {
  const [plans, setPlans] = useState<StudyPlan.UserPlan[] | undefined>(undefined)

  const loadData = async () => {
    const result = await (await loadPlan()).filter(i => !!i)
    setPlans(result)
  }

  useEffect(() => {
    loadData()
  }, [])

  const navigation = useNavigation()
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (plans !== undefined) {
        loadData()
      }
    })

    return unsubscribe
  }, [navigation, plans])

  const renderItem = ({ item }: { item: StudyPlan.UserPlan }) => {
    return <PlanItem plan={item} />
  }

  if (plans === undefined) {
    return <Loading />
  }

  if (plans.length === 0) {
    return (
      <EmptyData
        style={styles.emptyWrapper}
        imgStyle={styles.emptyImage}
        subtextStyle={styles.emptySubtext}
        text={I18n.t('text.You have no plans')}
        subText={I18n.t('text.Tap the button below to create a plan')}
        image={require('@assets/images/img-no-plan.png')}
      />
    )
  }
  return <FlatList data={plans} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} />
}

const styles = StyleSheet.create({
  emptyWrapper: {
    marginTop: 0,
    justifyContent: 'center',
  },
  emptyImage: {
    flexGrow: undefined,
    marginBottom: 10,
    width: 135,
    height: 135,
  },
  emptySubtext: {
    marginTop: 10,
    width: '60%',
  },
  planItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 25,
    borderRadius: 10,
  },
  durationText: {
    opacity: 0.5,
    marginTop: 5,
  },
  planImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 30,
  },
  itemInfo: {
    flex: 1,
  },
  list: {
    paddingBottom: 10,
  },
})

export default PlanList
