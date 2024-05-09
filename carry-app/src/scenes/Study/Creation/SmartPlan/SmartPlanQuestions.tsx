import Container from '@components/Container'
import * as React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import SMPLoading from './components/SMPLoading'
import Questions from './components/Questions'
import { useNavigation } from '@react-navigation/core'
import Constants from '@shared/Constants'
import { StackNavigationProp } from '@react-navigation/stack'
import Metrics from '@shared/Metrics'

const SmartPlanQuestions: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const scrollRef = React.useRef(null)
  const screenWidth = Metrics.screen.width
  const loadingComplete = () => {
    scrollRef.current?.scrollTo({ x: screenWidth, animated: true })
  }

  const onCompleteQuestion = () => {
    navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_BUILDING)
  }

  return (
    <Container safe>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollRef} bounces={false} scrollEnabled={false}>
        <View style={{ width: screenWidth }}>
          <SMPLoading style={s.smpLoading} onComplete={loadingComplete} />
          <View style={s.footer} />
        </View>
        <View style={{ width: screenWidth }}>
          <Questions onComplete={onCompleteQuestion} />
        </View>
      </ScrollView>
    </Container>
  )
}

const s = StyleSheet.create({
  smpLoading: {
    flex: 8,
  },
  footer: {
    flex: 2,
  },
})

export default SmartPlanQuestions
