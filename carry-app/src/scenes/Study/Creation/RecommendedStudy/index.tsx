import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { H2 } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { FlatList, Image, StyleSheet } from 'react-native'
import { usePlanData, usePublishAndApplyPlan } from '../AdvancedStudy/MainBuilderScreen/hook'
import RecommendedItem from './RecommendedItem'

type ParamProps = {
  //reserved
  orgResult: App.Organisation
  orgSharedPlans: Array<StudyPlan.UserPlan>
}

type Props = StackScreenProps<{ StudyListingScreen: ParamProps }, 'StudyListingScreen'>

const RecommendedStudy: React.FC<Props> = props => {
  const { color } = useTheme()
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const {
    route: {
      params: { orgResult, orgSharedPlans },
    },
  } = props

  const { plan, updatePlan } = usePlanData({
    defaultPlan: orgSharedPlans[selectedIndex],
  })

  const { handlePublishGoal } = usePublishAndApplyPlan({ plan, updatePlan, isSharedOrgPlan: true })

  const renderItem = ({ item, index }) => (
    <RecommendedItem item={item} index={index} selecting={index === selectedIndex} onSelect={onSelect} orgName={orgResult.name} />
  )

  const onSelect = index => {
    setSelectedIndex(index)
    updatePlan(orgSharedPlans[index])
  }

  const onPressUseThisPlan = () => {
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_CHOOSE_START_DATE, {
      onDateSelected: (publishDate: Date) => {
        handlePublishGoal(publishDate)
      },
    })
  }

  const onPressBack = () => NavigationRoot.pop()

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={`${color.text}50`}
        iconLeftSize={22}
        onPressLeft={onPressBack}
      />
      <FlatList
        ListHeaderComponent={() => (
          <>
            {/* <Avatar
              borderWidth={3}
              borderColor={color.whiteSmoke}
              style={styles.avatar}
              url={orgResult.image}
              size={100}
              name={orgResult.name}
              loading={false}
            /> */}
            <Image source={require('../../../../assets/images/recommended.png')} style={styles.headerImg} resizeMode="contain" />
            <H2 align="center" style={styles.title}>
              {I18n.t('text.Here are some plans your org recommends using', { orgName: orgResult.name })}
            </H2>
          </>
        )}
        data={orgSharedPlans}
        renderItem={renderItem}
        contentContainerStyle={styles.flatList}
      />
      <BottomButton title={I18n.t('text.Use this plan')} rounded disabled={selectedIndex === -1} onPress={onPressUseThisPlan} />
      <BottomButton
        titleStyle={styles.btnThin}
        backgroundColor="background"
        textColor="gray"
        title={I18n.t('text.No thanks')}
        rounded
        onPress={onPressBack}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 20,
    marginTop: 5,
    marginHorizontal: 45,
  },
  // avatar: {
  //   alignSelf: 'center',
  //   marginTop: 20,
  // },
  headerImg: { width: '80%', height: 200, alignSelf: 'center' },
  flatList: {
    paddingBottom: 16,
  },
  btnThin: { fontWeight: '500' },
})

export default RecommendedStudy
