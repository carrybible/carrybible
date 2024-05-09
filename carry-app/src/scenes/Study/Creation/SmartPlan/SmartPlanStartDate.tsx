import * as React from 'react'
import { StyleSheet, View, Pressable, Platform, TouchableOpacity, InteractionManager } from 'react-native'
import Container from '@components/Container'
import I18n from 'i18n-js'
import { H1, Text, Title } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import Styles from '@shared/Styles'
import Metrics from '@shared/Metrics'
import Icon from '@components/Icon'
import ProgressBar from '@components/ProgressBar'
import DatePicker from '@components/DatePicker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { delay, getDateFromFirestoreTime } from '@shared/Utils'
import Constants from '@shared/Constants'
import { useDispatch, useSelector } from 'react-redux'
import { TYPES } from '@redux/actions'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootState } from '@dts/state'

const ButtonOption = (props: any & { onPressItem: (key: number) => void }) => {
  const { color } = useTheme()
  const { title, des, onPressItem, btnKey } = props
  return (
    <View style={[Styles.shadow2, s.btn]}>
      <Pressable
        style={({ pressed }) => [
          s.itemContainer,
          {
            backgroundColor: color.background,
          },
          color.id === 'light' ? Styles.shadow : s.darkThemeShadow,
          pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : null,
        ]}
        android_ripple={{
          color: color.gray7,
        }}
        onPress={() => {
          onPressItem(btnKey)
        }}
      >
        <Text style={s.titleBtn}>{title}</Text>
        <Text style={s.des}>{des}</Text>
      </Pressable>
    </View>
  )
}

const SmartPlanStartDate: React.FC = props => {
  const [progress, setProgress] = React.useState(0.1)
  const [datePicker, setDatePicker] = React.useState({
    isVisible: false,
    value: new Date(),
  })
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const route = useRoute<any>()
  const groupId = route.params?.groupId || ''
  const organisationId = route.params?.organisationId || ''
  const { color } = useTheme()
  const dispatch = useDispatch()
  React.useEffect(() => {
    init()
  }, [])

  const init = async () => {
    await delay(300)
    setProgress(100)
  }

  const onPressItem = key => {
    if (key === 1) {
      // Choose a future date
      setDatePicker({
        isVisible: true,
        value: new Date(),
      })
    } else if (key === 2) {
      // Start after current plan ends
      startAterPlanEnds()
    } else {
      // Start plan today
      dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: new Date() })
      moveToSmpBuilding()
    }
  }

  const onPressBack = () => navigation.goBack()

  const startAterPlanEnds = async () => {
    const endDateFirestore = group.activeGoal?.endDate
    if (endDateFirestore) {
      const endDate = getDateFromFirestoreTime(endDateFirestore)
      dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: endDate })
      moveToSmpBuilding()
    }
  }

  const moveToSmpBuilding = () => {
    setProgress(100)
    navigation.navigate(Constants.SCENES.STUDY_PLAN.SMP_BUILDING, { groupId, organisationId })
  }

  const dismissDatePicker = async value => {
    setDatePicker({
      isVisible: false,
      value: value,
    })
    if (value) {
      dispatch({ type: TYPES.ONBOARDING.SET_START_DATE, startDate: value })
      moveToSmpBuilding()
    }
  }

  return (
    <>
      <Container safe style={s.container}>
        <View style={s.progressContainer}>
          <TouchableOpacity onPress={onPressBack}>
            <Icon source="arrow-left" color={color.text} size={28} />
          </TouchableOpacity>
          <ProgressBar shining value={progress} width="100%" style={s.progress} />
        </View>
        <H1 style={s.title}>{I18n.t('text.When do you want to start')}</H1>
        {group.activeGoal?.endDate && (
          <ButtonOption btnKey={2} onPressItem={onPressItem} title="⭐" des={I18n.t('text.Start after my current plan ends')} />
        )}
        <ButtonOption btnKey={0} onPressItem={onPressItem} title="☀️" des={I18n.t('text.Start study plan today ')} />
        <ButtonOption btnKey={1} onPressItem={onPressItem} title="🌙" des={I18n.t('text.Choose a future date')} />
        <DatePicker
          isVisible={datePicker.isVisible}
          handleDismiss={dismissDatePicker}
          current={datePicker.value}
          title={I18n.t('text.Choose a start date')}
          confirm={I18n.t('text.Confirm')}
          minimumDate={new Date()}
        />
      </Container>
    </>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Metrics.insets.horizontal,
  },
  title: {
    marginTop: 30,
    marginBottom: 52,
  },
  itemContainer: {
    height: 60,
    flexDirection: 'row',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progress: { backgroundColor: '#CDDBFF', height: 21, marginLeft: 16, flex: 1 },
  des: { marginLeft: 16, flexWrap: 'wrap', flex: 1 },
  titleBtn: { fontSize: 30 },
  btn: { paddingHorizontal: 2 },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
})

export default SmartPlanStartDate
