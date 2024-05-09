import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import DatePicker from '@components/DatePicker'
import HeaderBar from '@components/HeaderBar'
import { H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import I18n from '@shared/I18n'
import Metrics from '@shared/Metrics'
import Styles from '@shared/Styles'
import { getDateFromFirestoreTime } from '@shared/Utils'
import { isAfter } from 'date-fns'
import React, { useCallback, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'

type ChooseDateType = 'plan-end' | 'now' | 'choose-date'

type ParamProps = {
  onDateSelected: (date: Date) => void
}

type Props = StackScreenProps<{ ChooseStartDateScreen: ParamProps }, 'ChooseStartDateScreen'>

const ChooseStartDateScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const { onDateSelected } = props.route.params
  const [datePicker, setDatePicker] = useState(() => ({
    isVisible: false,
    value: new Date(),
  }))
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const [selectedBtn, setSelectedBtn] = useState<ChooseDateType | null>(null)

  const dismissDatePicker = useCallback(
    publishDate => {
      setDatePicker({
        isVisible: false,
        value: publishDate,
      })
      if (publishDate) {
        onDateSelected(publishDate)
      }
    },
    [onDateSelected],
  )

  return (
    <Container>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />

      <ScrollView style={s.wrapper}>
        <H1 align="center" style={s.title}>
          {I18n.t('text.When do you want to start')}
        </H1>

        {isAfter(group.activeGoal?.endDate.seconds * 1000, Date.now()) && (
          <ButtonOption
            onPress={() => {
              setSelectedBtn('plan-end')
            }}
            icon="⭐"
            title={I18n.t('text.Start after my current plan ends')}
            selected={selectedBtn === 'plan-end'}
          />
        )}
        <ButtonOption
          onPress={() => {
            setSelectedBtn('now')
          }}
          icon="☀️"
          title={I18n.t('text.Start study plan today ')}
          selected={selectedBtn === 'now'}
        />
        <ButtonOption
          onPress={() => {
            setSelectedBtn('choose-date')
          }}
          icon="🌙"
          title={I18n.t('text.Choose a future date')}
          selected={selectedBtn === 'choose-date'}
        />
      </ScrollView>

      <BottomButton
        rounded
        title={I18n.t('text.Continue')}
        disabled={selectedBtn == null}
        onPress={() => {
          if (selectedBtn === 'choose-date') {
            setDatePicker({
              value: new Date(),
              isVisible: true,
            })
          } else {
            const endDateFirestore = group.activeGoal?.endDate
            const publishDate = selectedBtn === 'plan-end' ? getDateFromFirestoreTime(endDateFirestore) : new Date()
            onDateSelected(publishDate)
          }
        }}
      />

      <DatePicker
        isVisible={datePicker.isVisible}
        handleDismiss={dismissDatePicker}
        current={datePicker.value}
        title={I18n.t('text.Choose a start date')}
        confirm={I18n.t('text.Confirm')}
        minimumDate={new Date()}
      />
    </Container>
  )
}

const ButtonOption = ({ onPress, icon, title, selected }: { onPress: () => void; icon: string; title: string; selected: boolean }) => {
  const { color } = useTheme()
  return (
    <Pressable
      style={({ pressed }) => [
        s.itemContainer,
        {
          backgroundColor: color.background,
        },
        color.id === 'light' ? Styles.shadow : Styles.shadowDark,
        pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : null,
        selected
          ? {
              borderColor: color.accent2,
              borderWidth: 1,
            }
          : null,
      ]}
      android_ripple={{
        color: color.gray7,
      }}
      onPress={onPress}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.des}>{title}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
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
  des: {
    marginLeft: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  icon: {
    fontSize: 30,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: Metrics.insets.horizontal,
  },
})

export default ChooseStartDateScreen
